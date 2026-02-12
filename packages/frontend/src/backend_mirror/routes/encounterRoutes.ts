import { Router } from "express";
import Patient from "../models/Patient"; // Fixed: Use default import
import Encounter from "../models/Encounter";
import Staff from "../models/Staff";
import { sequelize } from "../config/db";
import { Op } from "sequelize";

const router = Router();

// ✅ Test DB connection for encounters
router.get("/test-db", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, message: "Database connected for encounters" });
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ success: false, error: "Database connection failed" });
  }
});

// ✅ Get all encounters
router.get("/", async (_req, res) => {
  try {
    const encounters = await Encounter.findAll({
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName", "phone", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(encounters);
  } catch (err) {
    console.error("Error fetching encounters:", err);
    res.status(500).json({ error: "Failed to fetch encounters" });
  }
});

// ✅ Count encounters
router.get("/count", async (_req, res) => {
  try {
    const total = await Encounter.count();
    res.json({ total });
  } catch (err) {
    console.error("Error counting encounters:", err);
    res.status(500).json({ error: "Failed to count encounters" });
  }
});

// ✅ Get encounters by patient ID
router.get("/patient/:patientId", async (req, res) => {
  try {
    const encounters = await Encounter.findAll({
      where: { patient_id: req.params.patientId }, // Fixed: Use patient_id
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName", "phone", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(encounters);
  } catch (err) {
    console.error("Error fetching patient encounters:", err);
    res.status(500).json({ error: "Failed to fetch patient encounters" });
  }
});

// ✅ Search encounters (simplified to avoid field errors)
router.get("/search", async (req, res) => {
  const q = req.query.q?.toString() || "";
  try {
    const results = await Encounter.findAll({
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName"],
          where: {
            [Op.or]: [
              { firstName: { [Op.like]: `%${q}%` } },
              { lastName: { [Op.like]: `%${q}%` } },
            ],
          },
          required: false, // LEFT JOIN
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(results);
  } catch (err) {
    console.error("Error searching encounters:", err);
    res.status(500).json({ error: "Failed to search encounters" });
  }
});

// ✅ Get encounters by date range
router.get("/date-range", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Both startDate and endDate are required" });
  }

  try {
    const encounters = await Encounter.findAll({
      where: {
        createdAt: { // Fixed: Use createdAt instead of encounterDate
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        },
      },
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(encounters);
  } catch (err) {
    console.error("Error fetching encounters by date range:", err);
    res.status(500).json({ error: "Failed to fetch encounters by date range" });
  }
});

// ✅ Get single encounter
router.get("/:id", async (req, res) => {
  try {
    const encounter = await Encounter.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName", "phone", "email", "dob", "gender"],
        },
      ],
    });

    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    res.json(encounter);
  } catch (err) {
    console.error("Error fetching encounter:", err);
    res.status(500).json({ error: "Failed to fetch encounter" });
  }
});

// ✅ Create new encounter
router.post("/", async (req, res) => {
  try {
    // Validate that patient exists (check for both patientId and patient_id)
    const patientId = req.body.patientId || req.body.patient_id;
    if (!patientId) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Ensure the request body uses patient_id for the database
    const encounterData = { ...req.body };
    if (req.body.patientId && !req.body.patient_id) {
      encounterData.patient_id = req.body.patientId;
      delete encounterData.patientId;
    }

    const encounter = await Encounter.create(encounterData);

    // Return encounter with patient info
    const encounterWithPatient = await Encounter.findByPk(encounter.id, {
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName", "phone", "email"],
        },
      ],
    });

    res.status(201).json(encounterWithPatient);
  } catch (err) {
    console.error("Error creating encounter:", err);
    res.status(500).json({ error: "Failed to create encounter" });
  }
});

// ✅ Update encounter
router.put("/:id", async (req, res) => {
  try {
    const encounter = await Encounter.findByPk(req.params.id);
    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    // If patient ID is being updated, validate the new patient exists
    const newPatientId = req.body.patientId || req.body.patient_id;
    if (newPatientId && newPatientId !== encounter.patient_id) {
      const patient = await Patient.findByPk(newPatientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
    }

    // Ensure the request body uses patient_id for the database
    const updateData = { ...req.body };
    if (req.body.patientId && !req.body.patient_id) {
      updateData.patient_id = req.body.patientId;
      delete updateData.patientId;
    }

    await encounter.update(updateData);

    // Return updated encounter with patient info
    const updatedEncounter = await Encounter.findByPk(encounter.id, {
      include: [
        {
          model: Patient,
          as: 'patient', // Added alias
          attributes: ["id", "firstName", "lastName", "phone", "email"],
        },
      ],
    });

    res.json(updatedEncounter);
  } catch (err) {
    console.error("Error updating encounter:", err);
    res.status(500).json({ error: "Failed to update encounter" });
  }
});

// ✅ Delete encounter
router.delete("/:id", async (req, res) => {
  try {
    const encounter = await Encounter.findByPk(req.params.id);
    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    await encounter.destroy();
    res.json({ message: "Encounter deleted successfully" });
  } catch (err) {
    console.error("Error deleting encounter:", err);
    res.status(500).json({ error: "Failed to delete encounter" });
  }
});

// ✅ Get encounter statistics
router.get("/stats/overview", async (_req, res) => {
  try {
    const [total, thisMonth, thisWeek] = await Promise.all([
      Encounter.count(),
      Encounter.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      Encounter.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    res.json({
      total,
      thisMonth,
      thisWeek,
    });
  } catch (err) {
    console.error("Error fetching encounter stats:", err);
    res.status(500).json({ error: "Failed to fetch encounter statistics" });
  }
});

export default router;