import dotenv from "dotenv";
dotenv.config();
import { sequelize } from "./config/db";
import { User, Patient, Appointment, Invoice } from "./models/index";
import bcrypt from "bcrypt";

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@hospital.com";
    const adminPassPlain = process.env.SEED_ADMIN_PASSWORD || "admin123";
    const adminPass = await bcrypt.hash(adminPassPlain, 10);

    const [admin, created] = await (User as any).findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: "System Admin",
        email: adminEmail,
        password: adminPass,
        role: "admin",
      },
    });
    console.log("Admin present:", adminEmail);

    // sample clinician
    const clinicianPass = await bcrypt.hash("DrPass123", 10);
    await (User as any).findOrCreate({
      where: { email: "dr.smith@hospital.com" },
      defaults: {
        name: "Dr Smith",
        email: "dr.smith@hospital.com",
        password: clinicianPass,
        role: "clinician",
      },
    });

    // sample patient
    const [patient] = await (Patient as any).findOrCreate({
      where: { first_name: "John", last_name: "Doe" },
      defaults: {
        first_name: "John",
        last_name: "Doe",
        dob: "1980-01-01",
        gender: "male",
        phone: "0700111222",
        email: "john@example.com",
      },
    });

    // sample invoice
    if (patient) {
      await (Invoice as any).findOrCreate({
        where: { patient_id: patient.id, amount: 200.0 },
        defaults: {
          invoice_number: `INV-${Date.now()}`,
          patient_id: patient.id,
          amount: 200.0,
          status: "unpaid",
        },
      });
    }

    console.log("✅ Seed complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error", err);
    process.exit(1);
  }
}

seed();
