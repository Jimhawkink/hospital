// src/routes/patientRoutes.ts
import { Router } from "express";
import Patient from "../models/Patient";
import { sequelize } from "../config/db";
import { Op } from "sequelize";

const router = Router();

// ✅ Test DB connection
router.get("/test-db", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, message: "Database connected" });
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ success: false, error: "Database connection failed" });
  }
});

// ✅ Get all patients - FIXED: Removed 'address', added 'areaOfResidence'
router.get("/", async (_req, res) => {
  try {
    const patients = await Patient.findAll({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "gender",
        "dob",
        "phone",
        "email",
        "areaOfResidence", // Changed from 'address' to 'areaOfResidence'
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(patients);
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// ✅ Count patients
router.get("/count", async (_req, res) => {
  try {
    const total = await Patient.count();
    res.json({ total });
  } catch (err) {
    console.error("Error counting patients:", err);
    res.status(500).json({ error: "Failed to count patients" });
  }
});

// ✅ Search patients
router.get("/search", async (req, res) => {
  const q = req.query.q?.toString() || "";
  try {
    const results = await Patient.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: `%${q}%` } },
          { lastName: { [Op.like]: `%${q}%` } },
        ],
      },
    });
    res.json(results);
  } catch (err) {
    console.error("Error searching patients:", err);
    res.status(500).json({ error: "Failed to search patients" });
  }
});

// ✅ Get single patient
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    console.error("Error fetching patient:", err);
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// ✅ Create new patient
router.post("/", async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (err) {
    console.error("Error creating patient:", err);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

// ✅ Update patient
router.put("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await patient.update(req.body);
    res.json(patient);
  } catch (err) {
    console.error("Error updating patient:", err);
    res.status(500).json({ error: "Failed to update patient" });
  }
});

// ✅ Delete patient
router.delete("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await patient.destroy();
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error("Error deleting patient:", err);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

export default router;