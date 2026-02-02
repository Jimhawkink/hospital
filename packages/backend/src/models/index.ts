import { 
  Sequelize, 
  DataTypes, 
  Model, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional 
} from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/db";

/** =====================
 *  USER MODEL
 *  ===================== */
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: "admin" | "clinician" | "cashier";
}

User.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("admin", "clinician", "cashier"), defaultValue: "clinician" }
}, {
  sequelize,
  tableName: "users",
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed("password")) user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

/** =====================
 *  STAFF MODEL
 *  ===================== */
export class Staff extends Model<InferAttributes<Staff>, InferCreationAttributes<Staff>> {
  declare id: CreationOptional<number>;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare phone?: string;
  declare position: string;
  declare department: string;
  declare license_number?: string;
  declare hire_date: Date;
  declare status: "active" | "inactive" | "on_leave";
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Staff.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  position: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  license_number: { type: DataTypes.STRING, allowNull: true },
  hire_date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM("active", "inactive", "on_leave"), defaultValue: "active" },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, { 
  sequelize, 
  tableName: "staff"
});

/** =====================
 *  PATIENT MODEL
 *  ===================== */
export class Patient extends Model<InferAttributes<Patient>, InferCreationAttributes<Patient>> {
  declare id: CreationOptional<number>;
  declare first_name: string;
  declare last_name: string;
  declare dob: Date;
  declare gender: "male" | "female" | "other";
  declare phone: string;
  declare email: string;
  declare address: string;
}

Patient.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  first_name: DataTypes.STRING,
  last_name: DataTypes.STRING,
  dob: DataTypes.DATEONLY,
  gender: DataTypes.ENUM("male", "female", "other"),
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  address: DataTypes.TEXT
}, { sequelize, tableName: "patients" });

/** =====================
 *  APPOINTMENT MODEL
 *  ===================== */
export class Appointment extends Model<InferAttributes<Appointment>, InferCreationAttributes<Appointment>> {
  declare id: CreationOptional<number>;
  declare appointment_date: Date;
  declare reason: string;
  declare status: "scheduled" | "completed" | "cancelled";
}

Appointment.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  appointment_date: DataTypes.DATE,
  reason: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("scheduled", "completed", "cancelled"), defaultValue: "scheduled" }
}, { sequelize, tableName: "appointments" });

/** =====================
 *  ENCOUNTER MODEL
 *  ===================== */
export class Encounter extends Model<InferAttributes<Encounter>, InferCreationAttributes<Encounter>> {
  declare id: CreationOptional<number>;
  declare encounter_number: CreationOptional<string>;
  declare encounter_type: string;
  declare priority_type?: string;
  declare notes?: string;
  declare patient_id: number;
  declare provider_id: number;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Encounter.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  encounter_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  encounter_type: { type: DataTypes.STRING, allowNull: false },
  priority_type: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  patient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  provider_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, { 
  sequelize, 
  tableName: "encounters",
  hooks: {
    beforeCreate: async (encounter: Encounter) => {
      if (!encounter.encounter_number) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        encounter.encounter_number = `ENC-${timestamp}-${random}`;
      }
    },
  }
});

/** =====================
 *  COMPLAINT MODEL
 *  ===================== */
export class Complaint extends Model<InferAttributes<Complaint>, InferCreationAttributes<Complaint>> {
  declare id: CreationOptional<number>;
  declare encounter_id: number;
  declare complaint_text: string;
  declare duration_value?: number;
  declare duration_unit?: "Hours" | "Days" | "Weeks" | "Months" | "Years";
  declare comments?: string;
}

Complaint.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  encounter_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  complaint_text: { type: DataTypes.TEXT, allowNull: false },
  duration_value: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  duration_unit: { type: DataTypes.ENUM("Hours", "Days", "Weeks", "Months", "Years"), allowNull: true },
  comments: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, tableName: "complaints" });

/** =====================
 *  INVOICE MODEL
 *  ===================== */
export class Invoice extends Model<InferAttributes<Invoice>, InferCreationAttributes<Invoice>> {
  declare id: CreationOptional<number>;
  declare invoice_number: string;
  declare amount: number;
  declare status: "unpaid" | "partially_paid" | "paid" | "cancelled";
}

Invoice.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  invoice_number: DataTypes.STRING,
  amount: DataTypes.DECIMAL(10,2),
  status: { type: DataTypes.ENUM("unpaid", "partially_paid", "paid", "cancelled"), defaultValue: "unpaid" }
}, { sequelize, tableName: "invoices" });

/** =====================
 *  PAYMENT MODEL
 *  ===================== */
export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
  declare id: CreationOptional<number>;
  declare invoice_id: number;
  declare amount: number;
  declare method: "cash" | "card" | "mobile";
  declare transaction_code: string;
}

Payment.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  invoice_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  amount: DataTypes.DECIMAL(10, 2),
  method: DataTypes.ENUM("cash", "card", "mobile"),
  transaction_code: DataTypes.STRING
}, { sequelize, tableName: "payments" });

/** =====================
 *  ORGANIZATION SETTINGS MODEL
 *  ===================== */
export class OrganizationSetting extends Model<InferAttributes<OrganizationSetting>, InferCreationAttributes<OrganizationSetting>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare address: string;
  declare contact_email: string;
  declare contact_phone: string;
  declare logo_url: string;
}

OrganizationSetting.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: DataTypes.STRING,
  address: DataTypes.TEXT,
  contact_email: DataTypes.STRING,
  contact_phone: DataTypes.STRING,
  logo_url: DataTypes.STRING
}, { sequelize, tableName: "organization_settings" });

/** =====================
 *  PACKAGE MODEL
 *  ===================== */
export class Package extends Model<InferAttributes<Package>, InferCreationAttributes<Package>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description?: string;
  declare price: number;
  declare user_id?: number;
}

Package.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
}, { sequelize, tableName: "packages" });

/** =====================
 *  TRIAGE MODEL
 *  ===================== */
export class Triage extends Model<InferAttributes<Triage>, InferCreationAttributes<Triage>> {
  declare id: CreationOptional<number>;
  declare patient_id: number;
  declare patient_status: string;
  declare temperature?: number;
  declare heart_rate?: number;
  declare blood_pressure?: string;
  declare respiratory_rate?: number;
  declare blood_oxygenation?: number;
  declare weight?: number;
  declare height?: number;
  declare muac?: number;
  declare lmp_date?: Date;
  declare comments?: string;
  declare date: Date;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Triage.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  patient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  patient_status: { type: DataTypes.STRING, allowNull: true },
  temperature: { type: DataTypes.FLOAT, allowNull: true },
  heart_rate: { type: DataTypes.INTEGER, allowNull: true },
  blood_pressure: { type: DataTypes.STRING, allowNull: true },
  respiratory_rate: { type: DataTypes.INTEGER, allowNull: true },
  blood_oxygenation: { type: DataTypes.FLOAT, allowNull: true },
  weight: { type: DataTypes.FLOAT, allowNull: true },
  height: { type: DataTypes.FLOAT, allowNull: true },
  muac: { type: DataTypes.FLOAT, allowNull: true },
  lmp_date: { type: DataTypes.DATEONLY, allowNull: true },
  comments: { type: DataTypes.TEXT, allowNull: true },
  date: { type: DataTypes.DATE, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, { sequelize, tableName: "triages" });

/** =====================
 *  INVESTIGATION TEST MODEL
 *  ===================== */
export class InvestigationTest extends Model<InferAttributes<InvestigationTest>, InferCreationAttributes<InvestigationTest>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare department: string;
  declare type: 'laboratory' | 'imaging';
  declare parameters: string | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

InvestigationTest.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('laboratory', 'imaging'),
    allowNull: false,
  },
  parameters: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, {
  sequelize,
  tableName: 'investigation_tests',
  timestamps: true,
});

/** =====================
 *  INVESTIGATION REQUEST MODEL
 *  ===================== */
export class InvestigationRequest extends Model<InferAttributes<InvestigationRequest>, InferCreationAttributes<InvestigationRequest>> {
  declare id: CreationOptional<number>;
  declare encounter_id: number;
  declare test_id: number; // Changed from test_name to test_id
  declare department: string | null;
  declare type: 'laboratory' | 'imaging';
  declare status: 'requested' | 'not_collected' | 'collected' | 'results_posted';
  declare request_notes: string | null;
  declare requested_by: number;
  declare date_requested: Date;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

InvestigationRequest.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  encounter_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  test_id: { // Changed from test_name
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('laboratory', 'imaging'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('requested', 'not_collected', 'collected', 'results_posted'),
    defaultValue: 'requested',
  },
  request_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requested_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  date_requested: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, {
  sequelize,
  tableName: 'investigation_requests',
  timestamps: true,
});

/** =====================
 *  INVESTIGATION RESULT MODEL
 *  ===================== */
export class InvestigationResult extends Model<InferAttributes<InvestigationResult>, InferCreationAttributes<InvestigationResult>> {
  declare id: CreationOptional<number>;
  declare request_id: number;
  declare parameter: string | null;
  declare value: string;
  declare unit: string | null;
  declare reference_range: string | null;
  declare flag: string | null;
  declare notes: string | null;
  declare entered_by: number;
  declare date_entered: Date;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

InvestigationResult.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  request_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  parameter: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_range: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  entered_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  date_entered: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, {
  sequelize,
  tableName: 'investigation_results',
  timestamps: true,
});

/** =====================
 *  ASSOCIATIONS
 *  ===================== */

// Patient associations
Patient.hasMany(Appointment, { foreignKey: "patient_id" });
Patient.hasMany(Encounter, { foreignKey: "patient_id" });
Patient.hasMany(Invoice, { foreignKey: "patient_id" });

// Staff associations
Staff.hasMany(Encounter, { foreignKey: "provider_id" });

// User associations
User.hasMany(Appointment, { foreignKey: "doctor_id" });
User.hasMany(Package, { foreignKey: "user_id" });

// Appointment associations
Appointment.belongsTo(User, { foreignKey: "doctor_id" });
Appointment.belongsTo(Patient, { foreignKey: "patient_id" });

// Encounter associations
Encounter.belongsTo(Patient, { foreignKey: "patient_id", onDelete: "NO ACTION", onUpdate: "CASCADE" });
Encounter.belongsTo(Staff, { foreignKey: "provider_id", onDelete: "NO ACTION", onUpdate: "CASCADE" });

// Complaint associations
Complaint.belongsTo(Encounter, { foreignKey: "encounter_id", onDelete: "CASCADE" });
Encounter.hasMany(Complaint, { foreignKey: "encounter_id" });

// Invoice associations
Invoice.belongsTo(Patient, { foreignKey: "patient_id" });
Invoice.hasMany(Payment, { foreignKey: "invoice_id" });

// Payment associations
Payment.belongsTo(Invoice, { foreignKey: "invoice_id" });

// Package associations
Package.belongsTo(User, { foreignKey: "user_id" });

// Triage associations
Triage.belongsTo(Patient, { foreignKey: "patient_id", onDelete: "CASCADE" });

// Investigation associations
Encounter.hasMany(InvestigationRequest, { foreignKey: 'encounter_id' });
InvestigationRequest.belongsTo(Encounter, { foreignKey: 'encounter_id', onDelete: 'CASCADE' });
InvestigationRequest.belongsTo(Staff, { foreignKey: 'requested_by' });
InvestigationRequest.belongsTo(InvestigationTest, { foreignKey: 'test_id', targetKey: 'id' }); // Changed from test_name to test_id
InvestigationRequest.hasMany(InvestigationResult, { foreignKey: 'request_id' });
InvestigationResult.belongsTo(InvestigationRequest, { foreignKey: 'request_id', onDelete: 'CASCADE' });
InvestigationResult.belongsTo(Staff, { foreignKey: 'entered_by' });

/** =====================
 *  EXPORT ALL MODELS
 *  ===================== */
export default {
  User,
  Staff,
  Patient,
  Appointment,
  Encounter,
  Complaint,
  Invoice,
  Payment,
  OrganizationSetting,
  Package,
  Triage,
  InvestigationTest,
  InvestigationRequest,
  InvestigationResult,
  sequelize
};