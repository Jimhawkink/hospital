// routes/triage.ts - Enhanced with proper error handling and debugging
import express from "express";
import Triage from "../models/Triage";
import Patient from "../models/Patient";

const router = express.Router();

// POST /api/triage - Create new triage record
router.post("/", async (req, res) => {
  console.log("🏥 Creating triage record...");
  console.log("📋 Request body:", JSON.stringify(req.body, null, 2));

  try {
    // Validate required fields first
    const {
      patient_id,
      patientStatus,
      temperature,
      heartRate,
      bloodPressure,
      respiratoryRate,
      bloodOxygenation,
      weight,
      height,
      muac,
      lmpDate,
      comments,
      date
    } = req.body;

    // Check if patient exists
    if (!patient_id) {
      console.error("❌ Missing patient_id");
      return res.status(400).json({
        error: "Patient ID is required",
        details: "patient_id field is missing from request body"
      });
    }

    console.log(`🔍 Checking if patient ${patient_id} exists...`);
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      console.error(`❌ Patient ${patient_id} not found`);
      return res.status(404).json({
        error: "Patient not found",
        details: `No patient found with ID: ${patient_id}`
      });
    }

    console.log(`✅ Patient found: ${patient.firstName} ${patient.lastName}`);

    // Prepare data for Triage creation - map field names correctly
    const triageData = {
      patient_id: parseInt(patient_id),
      patient_status: patientStatus || undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      heart_rate: heartRate ? parseInt(heartRate) : undefined,
      blood_pressure: bloodPressure || undefined,
      respiratory_rate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
      blood_oxygenation: bloodOxygenation ? parseFloat(bloodOxygenation) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      muac: muac ? parseFloat(muac) : undefined,
      lmp_date: lmpDate ? new Date(lmpDate) : undefined,
      comments: comments || undefined,
      date: date ? new Date(date) : new Date()
    };

    console.log("🏗️ Prepared triage data:", JSON.stringify(triageData, null, 2));

    // Validate data types and ranges
    const validationErrors = [];

    if (triageData.temperature && (triageData.temperature < 30 || triageData.temperature > 45)) {
      validationErrors.push("Temperature must be between 30°C and 45°C");
    }

    if (triageData.heart_rate && (triageData.heart_rate < 30 || triageData.heart_rate > 250)) {
      validationErrors.push("Heart rate must be between 30 and 250 BPM");
    }

    if (triageData.respiratory_rate && (triageData.respiratory_rate < 5 || triageData.respiratory_rate > 60)) {
      validationErrors.push("Respiratory rate must be between 5 and 60 breaths per minute");
    }

    if (triageData.blood_oxygenation && (triageData.blood_oxygenation < 0 || triageData.blood_oxygenation > 100)) {
      validationErrors.push("Blood oxygenation must be between 0% and 100%");
    }

    if (triageData.weight && (triageData.weight < 0.5 || triageData.weight > 500)) {
      validationErrors.push("Weight must be between 0.5kg and 500kg");
    }

    if (triageData.height && (triageData.height < 30 || triageData.height > 250)) {
      validationErrors.push("Height must be between 30cm and 250cm");
    }

    if (validationErrors.length > 0) {
      console.error("❌ Validation errors:", validationErrors);
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors
      });
    }

    // Create the triage record
    console.log("💾 Creating triage record in database...");
    const triage = await Triage.create(triageData);

    console.log(`✅ Triage record created successfully with ID: ${triage.id}`);

    // Return the created record with patient info
    const createdTriage = await Triage.findByPk(triage.id, {
      include: [
        {
          model: Patient,
          attributes: ['id', 'firstName', 'lastName', 'patientNumber']
        }
      ]
    });

    res.status(201).json({
      message: "Triage record created successfully",
      data: createdTriage
    });

  } catch (error: any) {
    console.error("❌ Error creating triage record:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // Handle specific Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((err: any) => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error("Foreign key constraint error:", error.parent);
      return res.status(400).json({
        error: "Foreign key constraint violation",
        details: "Invalid patient_id or related data"
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error("Unique constraint error:", error.errors);
      return res.status(409).json({
        error: "Duplicate record",
        details: "A triage record with this data already exists"
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      console.error("Database error:", error.parent);
      return res.status(500).json({
        error: "Database error",
        details: process.env.NODE_ENV === 'development' ? error.message : "Internal database error"
      });
    }

    // Generic error handler
    console.error("Full error object:", error);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : "An unexpected error occurred"
    });
  }
});

// GET /api/triage - Get all triage records
router.get("/", async (req, res) => {
  try {
    const triageRecords = await Triage.findAll({
      include: [
        {
          model: Patient,
          attributes: ['id', 'firstName', 'lastName', 'patientNumber']
        }
      ],
      order: [['date', 'DESC']]
    });

    res.json({
      message: "Triage records retrieved successfully",
      data: triageRecords,
      count: triageRecords.length
    });
  } catch (error: any) {
    console.error("❌ Error fetching triage records:", error);
    res.status(500).json({
      error: "Failed to fetch triage records",
      details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

// GET /api/triage/:id - Get specific triage record
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const triageRecord = await Triage.findByPk(id, {
      include: [
        {
          model: Patient,
          attributes: ['id', 'firstName', 'lastName', 'patientNumber']
        }
      ]
    });

    if (!triageRecord) {
      return res.status(404).json({
        error: "Triage record not found",
        details: `No triage record found with ID: ${id}`
      });
    }

    res.json({
      message: "Triage record retrieved successfully",
      data: triageRecord
    });
  } catch (error: any) {
    console.error("❌ Error fetching triage record:", error);
    res.status(500).json({
      error: "Failed to fetch triage record",
      details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

// GET /api/triage/patient/:patientId - Get triage records for a specific patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const triageRecords = await Triage.findAll({
      where: { patient_id: patientId },
      include: [
        {
          model: Patient,
          attributes: ['id', 'firstName', 'lastName', 'patientNumber']
        }
      ],
      order: [['date', 'DESC']]
    });

    res.json({
      message: `Triage records for patient ${patientId} retrieved successfully`,
      data: triageRecords,
      count: triageRecords.length
    });
  } catch (error: any) {
    console.error("❌ Error fetching patient triage records:", error);
    res.status(500).json({
      error: "Failed to fetch patient triage records",
      details: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
});

export default router;