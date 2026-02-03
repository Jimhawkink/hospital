// server.ts (updated for diagnosis)
// Improved sync/locking/retry logic + safer foreign-key handling + nicer logging

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import { sequelize } from "./config/db";

// -----------------------------
// FIX: Explicitly load .env file from the current working directory
// -----------------------------
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// -----------------------------
// DIAGNOSTIC LOGGING - START
// -----------------------------
console.log("--- ENVIRONMENT VARIABLE DIAGNOSIS ---");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "LOADED" : "UNDEFINED");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "LOADED" : "UNDEFINED");
console.log("------------------------------------");
// -----------------------------
// DIAGNOSTIC LOGGING - END
// -----------------------------

// Import models (preserve your default / named exports)
import User from "./models/User";
import Patient from "./models/Patient";
import Appointment from "./models/Appointment";
import OrganisationSetting from "./models/OrganisationSetting";
import PaymentMethod from "./models/PaymentMethod";
import Product from "./models/Product";
import Staff from "./models/Staff";
import Triage from "./models/Triage";
import Encounter from "./models/Encounter";
import Complaint from "./models/Complaint";
import InvestigationTest from './models/InvestigationTest';
import InvestigationRequest from './models/InvestigationRequest';
import InvestigationResult from './models/InvestigationResult';
import UserRole from './models/UserRole';
import Permission from './models/Permission';
import RolePermission from './models/RolePermission';
import Invoice from "./models/Invoice";
import Payment from "./models/Payment";
import Stock from "./models/Stock";
import Package from "./models/Package";
import AppointmentType from "./models/AppointmentType";

const app = express();

// -----------------------------
// Utilities (rest of the file remains the same)
// -----------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Exponential backoff + jitter retry wrapper tailored for deadlocks
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 500
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // PostgreSQL deadlock codes: 40P01 is deadlock_detected
      const isDeadlock = error?.parent?.code === "40P01" || error?.parent?.code === "ER_LOCK_DEADLOCK" || error?.parent?.errno === 1213;
      if (isDeadlock && attempt < maxRetries - 1) {
        const backoff = baseDelay * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 200);
        console.warn(`⚠️ Deadlock detected - retrying in ${backoff + jitter}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(backoff + jitter);
        continue;
      }
      throw error;
    }
  }
  // unreachable but satisfy types
  throw new Error("withRetry: exhausted retries");
};

// Simple filesystem lock to ensure only one process runs migrations/sync at a time.
// Good for single-host deployments. Use Redis/etcd for multi-host cluster.
const MIGRATE_LOCK_PATH = path.join(os.tmpdir(), "hospital_migrate.lock");

const acquireMigrateLock = async (timeout = 30000): Promise<void> => {
  const start = Date.now();
  while (true) {
    try {
      // Fail if file exists - use 'wx' to create exclusively
      const fd = fs.openSync(MIGRATE_LOCK_PATH, "wx");
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      return;
    } catch {
      if (Date.now() - start > timeout) {
        throw new Error("Failed to acquire migration lock (timeout)");
      }
      await sleep(500);
    }
  }
};

const releaseMigrateLock = async (): Promise<void> => {
  try {
    if (fs.existsSync(MIGRATE_LOCK_PATH)) fs.unlinkSync(MIGRATE_LOCK_PATH);
  } catch (err) {
    console.warn("⚠️ Could not release migration lock:", err);
  }
};

// Ensure lock is released on process exit
const setupExitHandlers = () => {
  const exitHandler = () => {
    if (fs.existsSync(MIGRATE_LOCK_PATH)) {
      console.log("🧹 Cleaning up migration lock on exit...");
      fs.unlinkSync(MIGRATE_LOCK_PATH);
    }
    // Only call process.exit() if it's not the 'exit' event itself
    if (process.listenerCount('exit') > 0) {
      process.exit();
    }
  };

  process.on('exit', exitHandler);
  process.on('SIGINT', exitHandler); // Ctrl+C
  process.on('SIGTERM', exitHandler); // kill command
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    exitHandler();
  });
};

// Helper to safely execute raw SQL and normalize results
const runQuery = async (sql: string) => {
  const res = await sequelize.query(sql);
  // sequelize.query returns [results, metadata] so return first element
  return Array.isArray(res) ? (res[0] as any) : res;
};

// -----------------------------
// Manual table creation fallbacks (kept from your original, improved slightly)
// -----------------------------
const createEncounterTableManually = async (): Promise<void> => {
  try {
    console.log("🛠️ Attempting manual creation of encounters table...");

    const database = (sequelize.config as any).database;

    const patientResults = await runQuery(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'hms_patients'
        AND COLUMN_NAME = 'id'
    `);

    const staffResults = await runQuery(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'hms_staff'
        AND COLUMN_NAME = 'id'
    `);

    const patientIdType = Array.isArray(patientResults) && patientResults.length > 0
      ? (patientResults[0] as any).DATA_TYPE
      : 'INTEGER';

    const staffIdType = Array.isArray(staffResults) && staffResults.length > 0
      ? (staffResults[0] as any).DATA_TYPE
      : 'INTEGER';

    console.log(`📊 Patient ID type: ${patientIdType}`);
    console.log(`📊 Staff ID type: ${staffIdType}`);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS hms_encounters (
        id SERIAL PRIMARY KEY,
        encounter_number VARCHAR(255) NOT NULL UNIQUE,
        encounter_type VARCHAR(255) NOT NULL,
        priority_type VARCHAR(255) NOT NULL,
        notes TEXT,
        patient_id INTEGER NOT NULL REFERENCES hms_patients(id),
        provider_id INTEGER NOT NULL REFERENCES hms_staff(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Encounters table created successfully");

    // Attempt foreign keys, but do not fail hard when impossible (we logged earlier)
    try {
      await runQuery(`
        ALTER TABLE hms_encounters
        ADD CONSTRAINT fk_encounters_patient_id
        FOREIGN KEY (patient_id) REFERENCES hms_patients(id)
        ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
      console.log("✅ Added foreign key for patient_id");
    } catch (fkError: any) {
      console.warn("⚠️ Could not add foreign key for patient_id:", fkError.message || fkError);
    }

    try {
      await runQuery(`
        ALTER TABLE hms_encounters
        ADD CONSTRAINT fk_encounters_provider_id
        FOREIGN KEY (provider_id) REFERENCES hms_staff(id)
        ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
      console.log("✅ Added foreign key for provider_id");
    } catch (fkError: any) {
      console.warn("⚠️ Could not add foreign key for provider_id:", fkError.message || fkError);
    }

    console.log("✅ Manual creation of encounters table completed");
  } catch (error) {
    console.error("❌ Manual creation of encounters table failed:", error);
    // Final fallback: create without foreign keys
    try {
      console.log("🔄 Attempting to create table without foreign keys...");
      await runQuery(`
        CREATE TABLE IF NOT EXISTS hms_encounters (
          id SERIAL PRIMARY KEY,
          encounter_number VARCHAR(255) NOT NULL UNIQUE,
          encounter_type VARCHAR(255) NOT NULL,
          priority_type VARCHAR(255) NOT NULL,
          notes TEXT,
          patient_id INTEGER NOT NULL,
          provider_id INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ hms_encounters table created without foreign keys");
    } catch (finalError) {
      console.error("❌ Final attempt to create hms_encounters table failed:", finalError);
    }
  }
};

const createComplaintTableManually = async (): Promise<void> => {
  try {
    console.log("🛠️ Attempting manual creation of complaints table...");
    await runQuery(`
      CREATE TABLE IF NOT EXISTS hms_complaints (
        id SERIAL PRIMARY KEY,
        encounter_id INTEGER NOT NULL REFERENCES hms_encounters(id) ON DELETE CASCADE,
        complaint_text TEXT NOT NULL,
        duration_value INTEGER,
        duration_unit VARCHAR(50),
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Manual creation of hms_complaints table completed");

    try {
      await runQuery(`
        ALTER TABLE hms_complaints
        ADD CONSTRAINT fk_complaints_encounter_id
        FOREIGN KEY (encounter_id) REFERENCES hms_encounters(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log("✅ Added foreign key for hms_complaints.encounter_id");
    } catch (fkError: any) {
      console.warn("⚠️ Could not add foreign key for hms_complaints.encounter_id:", fkError.message || fkError);
    }
  } catch (error) {
    console.error("❌ Manual creation of complaints table failed:", error);
  }
};

const createTriageTableManually = async (): Promise<void> => {
  try {
    console.log("🛠️ Attempting manual creation of triage table...");
    await runQuery(`
      CREATE TABLE IF NOT EXISTS hms_triages (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
        patient_status VARCHAR(255),
        temperature FLOAT,
        heart_rate INT,
        blood_pressure VARCHAR(50),
        respiratory_rate INT,
        blood_oxygenation FLOAT,
        weight FLOAT,
        height FLOAT,
        muac FLOAT,
        lmp_date DATE,
        comments TEXT,
        date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Manual creation of hms_triages table completed");
  } catch (error) {
    console.error("❌ Manual creation of triage table failed:", error);
  }
};

const createAppointmentTableManually = async (): Promise<void> => {
  try {
    console.log("🛠️ Attempting manual creation of appointments table...");
    await runQuery(`
      CREATE TABLE IF NOT EXISTS hms_appointments (
        id SERIAL PRIMARY KEY,
        appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
        reason TEXT,
        doctor_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL REFERENCES hms_patients(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Manual creation of hms_appointments table completed");
  } catch (error) {
    console.error("❌ Manual creation of appointments table failed:", error);
  }
};

// -----------------------------
// Sync with fallback logic
// -----------------------------
const syncModelWithFallback = async (model: any): Promise<void> => {
  try {
    const tableName = typeof model.getTableName === "function" ? model.getTableName() : model.tableName || model.name;
    console.log(`⏳ Attempting to sync model: ${model.name} (table: ${tableName})`);

    await withRetry(() => model.sync({ alter: true }), 5, 500);
    console.log(`✅ ${model.name} sync completed`);
  } catch (error) {
    console.warn(`⚠️ Sync for ${model.name} failed, attempting manual table creation...`);
    // route to manual fallbacks where relevant
    if (model.name === "Encounter" || (model.name && model.name.toLowerCase().includes("encounter"))) {
      await createEncounterTableManually();
    } else if (model.name === "Complaint" || (model.name && model.name.toLowerCase().includes("complaint"))) {
      await createComplaintTableManually();
    } else if (model.name === "Triage" || (model.name && model.name.toLowerCase().includes("triage"))) {
      await createTriageTableManually();
    } else if (model.name === "Appointment" || (model.name && model.name.toLowerCase().includes("appointment"))) {
      await createAppointmentTableManually();
    } else {
      console.error(`❌ Error syncing ${model.name} and no fallback available:`, error);
      throw error;
    }
  }
};

const verifyTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const database = (sequelize.config as any).database;
    const [rows] = await sequelize.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_name = '${tableName}'
    `);
    const resultArray = Array.isArray(rows) ? rows as any[] : [];
    if (resultArray.length > 0 && resultArray[0].table_count !== undefined) {
      const exists = resultArray[0].table_count > 0;
      console.log(`🔍 Table '${tableName}' exists: ${exists}`);
      return exists;
    }
    console.log(`🔍 Table '${tableName}' exists: false (no count result)`);
    return false;
  } catch (error) {
    console.error(`❌ Error checking table '${tableName}':`, error);
    return false;
  }
};

const syncModelsSequentially = async (models: any[], label: string): Promise<void> => {
  console.log(`⏳ Syncing ${label}...`);
  for (const model of models) {
    await syncModelWithFallback(model);
  }
};

// -----------------------------
// Seeding functions (kept mostly intact, small improvements)
// -----------------------------
const seedUsers = async (): Promise<void> => {
  console.log("🌱 Seeding users (idempotent)...");
  const bcrypt = (await import("bcryptjs")).default;

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@hospital.test";
  const adminPlainPassword = process.env.SEED_ADMIN_PASSWORD || "1234";
  const adminPassword = await bcrypt.hash(adminPlainPassword, 10);
  const defaultPassword = await bcrypt.hash("1234", 10);

  const ensureUser = async (user: { name: string; email: string; role: string; passwordHash?: string }) => {
    const [record, created] = await User.findOrCreate({
      where: { email: user.email },
      defaults: {
        name: user.name,
        role: user.role,
        password: user.passwordHash ?? defaultPassword,
      },
    });
    console.log(`${created ? "✅ Created" : "↔️ Exists"}: ${user.role} - ${user.email}`);
    return record;
  };

  await ensureUser({ name: "Administrator", email: adminEmail, role: "admin", passwordHash: adminPassword });
  await ensureUser({ name: "Dr. John Doe", email: "doctor@hospital.test", role: "doctor" });
  await ensureUser({ name: "Nurse Mary Jane", email: "nurse@hospital.test", role: "nurse" });
  await ensureUser({ name: "Pharmacist Paul Smith", email: "pharmacist@hospital.test", role: "pharmacist" });
  await ensureUser({ name: "Cashier Alice Brown", email: "cashier@hospital.test", role: "cashier" });
  await ensureUser({ name: "Clerk Bob Wilson", email: "clerk@hospital.test", role: "clerk" });

  const totalUsers = await User.count();
  console.log(`📊 Seeding complete. Users in DB: ${totalUsers}. Admin: ${adminEmail} / ${adminPlainPassword}`);
};

const seedPatientsAndTriage = async (): Promise<number[]> => {
  console.log("🌱 Seeding patients and triage data (idempotent)...");
  const ensurePatient = async (patient: { firstName: string; lastName: string; dob: string; gender: "Male" | "Female" | "Other" }) => {
    const [record, created] = await Patient.findOrCreate({
      where: { firstName: patient.firstName, lastName: patient.lastName, dob: new Date(patient.dob) },
      defaults: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dob: new Date(patient.dob),
        gender: patient.gender,
        patientStatus: "Alive",
        phone: "123-456-7890",
      },
    });
    console.log(`${created ? "✅ Created" : "↔️ Exists"}: Patient - ${patient.firstName} ${patient.lastName}`);
    return record;
  };

  const samplePatients = [
    { firstName: "Jael", lastName: "Mwanake", dob: "1998-04-03", gender: "Female" as const },
    { firstName: "John", lastName: "Smith", dob: "1990-05-15", gender: "Male" as const },
  ];

  let patientIds: number[] = [];
  for (const patient of samplePatients) {
    const patientRecord = await ensurePatient(patient);
    patientIds.push(patientRecord.id);

    const [triageRecord, triageCreated] = await Triage.findOrCreate({
      where: { patient_id: patientRecord.id, date: new Date("2025-09-05 10:17:00") },
      defaults: {
        patient_id: patientRecord.id,
        patient_status: "Stable",
        temperature: 38.0,
        heart_rate: 84,
        blood_pressure: "124/86",
        respiratory_rate: 16,
        blood_oxygenation: 98.0,
        weight: 56.0,
        height: 145.0,
        muac: undefined,
        lmp_date: new Date("2024-12-04"),
        comments: "Asthmatic, AAR",
        date: new Date("2025-09-05 10:17:00"),
      },
    });
    console.log(`${triageCreated ? "✅ Created" : "↔️ Exists"}: Triage - Patient ${patient.firstName} ${patient.lastName}`);
  }

  console.log("📊 Seeding of patients and triage data complete.");
  return patientIds;
};

const seedEncounters = async (patientIds: number[]): Promise<void> => {
  console.log("🌱 Seeding encounters (idempotent)...");
  const encountersTableExists = await verifyTableExists("hms_encounters");
  if (!encountersTableExists) {
    console.warn("⚠️ Cannot seed encounters - table does not exist!");
    return;
  }

  const staffMembers = await Staff.findAll();
  const providerId = staffMembers.length > 0 ? (staffMembers[0] as any).id : 1;

  const sampleEncounters = [
    {
      encounter_number: "ENC-1757496483769-729",
      encounter_type: "Delivery",
      priority_type: "High",
      notes: "",
      patient_id: patientIds[0] || 1,
      provider_id: providerId,
      createdAt: new Date("2025-09-10 09:28:03"),
      updatedAt: new Date("2025-09-10 09:28:03"),
    },
  ];

  for (const encounter of sampleEncounters) {
    try {
      const [record, created] = await Encounter.findOrCreate({
        where: { encounter_number: encounter.encounter_number },
        defaults: encounter,
      } as any);
      console.log(`${created ? "✅ Created" : "↔️ Exists"}: Encounter - ${encounter.encounter_number}`);
    } catch (error) {
      console.error(`❌ Failed to seed encounter ${encounter.encounter_number}:`, error);
    }
  }

  const totalEncounters = await Encounter.count();
  console.log(`📊 Encounter seeding complete. Encounters in DB: ${totalEncounters}`);
};

const seedInvestigationTests = async (): Promise<void> => {
  console.log("🌱 Seeding investigation tests (idempotent)...");
  const sampleTests = [
    { name: "Malaria antigen", department: "Microbiology", type: "laboratory", parameters: null },
    {
      name: "Haemogram",
      department: "Haematology",
      type: "laboratory",
      parameters: JSON.stringify([
        { parameter: "Hb", unit: "g/dL", range: "12-18" },
        { parameter: "RBC", unit: "10^12/L", range: "4.2-6.1" },
        { parameter: "Haematocrit", unit: "%", range: "37-54" },
        { parameter: "MCV", unit: "fL", range: "76-99" },
        { parameter: "MCH", unit: "pg", range: "27-31" },
        { parameter: "MCHC", unit: "g/dL", range: "32-36" },
        { parameter: "RDW-SD", unit: "fL", range: "11-16" },
        { parameter: "RDW-CV", unit: "%", range: "11-16" },
      ]),
    },
    { name: "Random blood sugar", department: "Biochemistry", type: "laboratory", parameters: null },
    { name: "Hepatitis B surface antigen", department: "Microbiology", type: "laboratory", parameters: null },
    { name: "Syphilis VDRL", department: "Microbiology", type: "laboratory", parameters: null },
    { name: "HIV test", department: "Microbiology", type: "laboratory", parameters: null },
  ];

  for (const test of sampleTests) {
    const [record, created] = await InvestigationTest.findOrCreate({
      where: { name: test.name },
      defaults: test,
    } as any);
    console.log(`${created ? "✅ Created" : "↔️ Exists"}: Test - ${test.name}`);
  }

  console.log("📊 Seeding of investigation tests complete.");
};

// -----------------------------
// Middleware & routes
// -----------------------------
const setupMiddleware = (): void => {
  console.log("🔧 Setting up middleware...");
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "../Uploads")));
  app.use((req, _res, next) => {
    console.log(`📥 ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) console.log("➡️ Request body:", req.body);
    next();
  });
  console.log("✅ Middleware set up");
};

const setupRoutes = async (): Promise<void> => {
  console.log("🛣️ Loading route handlers...");

  const registerRoute = async (pathRoute: string, name: string, routeModule: any) => {
    try {
      if (routeModule && typeof routeModule === "function") {
        app.use(pathRoute, routeModule);
        console.log(`✅ ${name} registered at ${pathRoute}`);
      } else {
        console.error(`❌ ${name} is not a valid Express Router`);
      }
    } catch (error) {
      console.error(`❌ Failed to load ${name}:`, error);
    }
  };

  // load routes with imports
  await registerRoute("/api/auth", "authRoutes", (await import("./routes/authRoutes")).default);
  await registerRoute("/api/patients", "patientRoutes", (await import("./routes/patientRoutes")).default);
  await registerRoute("/api/appointments", "appointmentRoutes", (await import("./routes/appointmentRoutes")).default);
  await registerRoute("/api/appointment-types", "appointmentTypeRoutes", (await import("./routes/appointmentTypeRoutes")).default);
  await registerRoute("/api/encounters", "encounterRoutes", (await import("./routes/encounterRoutes")).default);

  // complaint routes
  await registerRoute("/api", "complaintRoutes", (await import("./routes/complaintRoutes")).default);

  await registerRoute("/api/invoices", "invoiceRoutes", (await import("./routes/invoiceRoutes")).default);
  await registerRoute("/api/organisation-settings", "organisationSettingsRoutes", (await import("./routes/organisationSettingsRoutes")).default);
  await registerRoute("/api/stock", "stockRoutes", (await import("./routes/stockRoutes")).default);
  await registerRoute("/api/organization/payment-methods", "paymentMethodRoutes", (await import("./routes/paymentMethodRoutes")).default);
  await registerRoute("/api/staff", "staffRoutes", (await import("./routes/staffRoutes")).default);
  await registerRoute("/api/triage", "triageRoutes", (await import("./routes/triage")).default);
  await registerRoute("/api/investigation-requests", "investigationRoutes", (await import("./routes/investigationRoutes")).default);
  await registerRoute("/api/organization", "rolePermissionRoutes", (await import("./routes/rolePermissionRoutes")).default);

  app.get("/api/health", (_req, res) =>
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    })
  );

  console.log("✅ All routes registered");
};

// -----------------------------
// App startup
// -----------------------------
(async () => {
  console.log("🔧 Starting application setup...");

  try {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
    const NODE_ENV = process.env.NODE_ENV || "development";

    console.log("⏳ Connecting to DB...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // ----------------------
    // Associations
    // ----------------------
    console.log("🔗 Setting up associations...");
    User.hasMany(Appointment, { foreignKey: "doctor_id" });
    Patient.hasMany(Appointment, { foreignKey: "patient_id" });
    Appointment.belongsTo(User, { foreignKey: "doctor_id" });
    Appointment.belongsTo(Patient, { foreignKey: "patient_id" });
    Triage.belongsTo(Patient, { foreignKey: "patient_id", onDelete: "CASCADE" });
    Encounter.belongsTo(Patient, { foreignKey: "patient_id", onDelete: "NO ACTION", onUpdate: "CASCADE" });
    Encounter.belongsTo(Staff, { foreignKey: "provider_id", onDelete: "NO ACTION", onUpdate: "CASCADE" });

    Complaint.belongsTo(Encounter, { foreignKey: "encounter_id", onDelete: "CASCADE" });
    Encounter.hasMany(Complaint, { foreignKey: "encounter_id" });

    Encounter.hasMany(InvestigationRequest, { foreignKey: "encounter_id" });
    InvestigationRequest.belongsTo(Encounter, { foreignKey: "encounter_id", onDelete: "CASCADE" });
    InvestigationRequest.belongsTo(Staff, { foreignKey: "requested_by" });
    InvestigationRequest.belongsTo(InvestigationTest, { foreignKey: "test_name", targetKey: "name", as: "test" });
    InvestigationRequest.hasMany(InvestigationResult, { foreignKey: "request_id" });
    InvestigationResult.belongsTo(InvestigationRequest, { foreignKey: "request_id", onDelete: "CASCADE" });
    InvestigationResult.belongsTo(Staff, { foreignKey: "entered_by" });

    console.log("✅ Associations set up");

    // ----------------------
    // Ensure only one process performs schema changes
    // ----------------------
    setupExitHandlers(); // Setup exit handlers before acquiring lock
    console.log("🔐 Acquiring migration lock...");
    await acquireMigrateLock();
    console.log("🔐 Migration lock acquired");

    // Always try to re-enable FK checks after sync attempts
    try {
      console.log("📦 Syncing models with schema updates...");

      // Disable FK checks temporarily for sync (PostgreSQL style)
      try {
        await sequelize.query("SET session_replication_role = 'replica'");
        console.log("🔓 Foreign key checks disabled (session_replication_role=replica)");
      } catch (fkErr) {
        console.warn("⚠️ Could not disable foreign key checks:", fkErr);
      }

      // Sync independent models first
      await syncModelsSequentially(
        [
          OrganisationSetting,
          PaymentMethod,
          Product,
          Staff,
          User,
          Patient,
          UserRole,
          Permission,
          RolePermission,
          AppointmentType,
          Stock,
          Package,
          Invoice,
          Payment
        ],
        "independent models"
      );

      // Sync dependent models (with fallbacks)
      console.log("⏳ Syncing dependent models...");
      for (const model of [Appointment, Triage, Encounter, Complaint, InvestigationTest, InvestigationRequest, InvestigationResult]) {
        await syncModelWithFallback(model);
      }

      // Re-enable foreign key checks in finally below

      console.log("✅ All models synced");
    } finally {
      try {
        await sequelize.query("SET session_replication_role = 'origin'");
        console.log("🔒 Foreign key checks re-enabled (session_replication_role=origin)");
      } catch (err) {
        console.warn("⚠️ Could not re-enable foreign key checks:", err);
      }
      // release migration lock so other processes (if any) can proceed
      await releaseMigrateLock();
      console.log("🔐 Migration lock released");
    }

    // ----------------------
    // Verify tables exist
    // ----------------------
    console.log("🔍 Verifying all tables exist before seeding...");
    const requiredTables = ["hms_patients", "hms_staff", "hms_triages", "hms_appointments"];
    const optionalTables = ["hms_encounters", "hms_complaints", "hms_investigation_tests", "hms_investigation_requests", "hms_investigation_results"];
    let criticalTablesExist = true;

    for (const table of requiredTables) {
      const exists = await verifyTableExists(table);
      if (!exists) {
        console.error(`❌ Required table '${table}' is missing!`);
        criticalTablesExist = false;
      }
    }

    for (const table of optionalTables) {
      const exists = await verifyTableExists(table);
      if (!exists) {
        console.warn(`⚠️ Optional table '${table}' is missing - some features may not work`);
      }
    }

    if (!criticalTablesExist) {
      console.error("❌ Critical: Some required tables are missing!");
      // In production you might want to exit; for dev you might continue.
      if (NODE_ENV === "production") process.exit(1);
    }

    console.log("✅ Table verification complete");

    // ----------------------
    // Seeding
    // ----------------------
    console.log("🌱 Starting seeding...");
    await seedUsers();
    const patientIds = await seedPatientsAndTriage();
    await seedEncounters(patientIds);
    await seedInvestigationTests();
    console.log("✅ Seeding complete");

    // ----------------------
    // Middleware & routes
    // ----------------------
    setupMiddleware();
    await setupRoutes();

    // error handler
    const { errorHandler } = await import("./middleware/errorHandler");
    app.use(errorHandler);

    // start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log("✅ All systems ready");
    });
  } catch (error) {
    console.error("❌ Server setup error:", error);
    // ensure migration lock release if something blew up before release
    try {
      await releaseMigrateLock();
    } catch { }
    process.exit(1);
  }
})().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
// Trigger Vercel deployment
