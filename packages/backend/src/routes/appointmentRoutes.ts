import { Router, Request, Response } from "express";
import Appointment from "../models/Appointment";
import AppointmentType from "../models/AppointmentType";
import Patient from "../models/Patient";
import Staff from "../models/Staff";
import { authenticate } from "../middleware/auth";
import { sequelize } from "../config/db";
import { QueryTypes } from "sequelize";

const router = Router();
router.use(authenticate);

// Helper to calculate age
const calculateAge = (dob: Date | string | null): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// GET all appointments with joined data
router.get("/", async (req: Request, res: Response) => {
  try {
    // Try to use the view first
    try {
      const viewData = await sequelize.query(
        "SELECT * FROM vw_appointments_detailed ORDER BY appointment_date, appointment_time",
        { type: QueryTypes.SELECT }
      );
      return res.json(viewData);
    } catch (viewError) {
      // View doesn't exist, fall back to manual join
      console.log("View not available, using manual query");
    }

    // Manual query with joins
    const appointments = await Appointment.findAll({
      order: [["appointment_date", "ASC"], ["appointment_time", "ASC"]],
      raw: true,
    });

    // Enrich with patient and type data
    const enrichedAppointments = await Promise.all(
      appointments.map(async (apt: any) => {
        let patient = null;
        let appointmentType = null;
        let bookedByStaff = null;

        try {
          patient = await Patient.findByPk(apt.patient_id, { raw: true });
        } catch { }

        try {
          if (apt.appointment_type_id) {
            appointmentType = await AppointmentType.findByPk(apt.appointment_type_id, { raw: true });
          }
        } catch { }

        try {
          if (apt.booked_by) {
            bookedByStaff = await Staff.findByPk(apt.booked_by, { raw: true });
          }
        } catch { }

        const patientName = patient
          ? `${(patient as any).first_name || (patient as any).firstName || ''} ${(patient as any).middle_name || (patient as any).middleName || ''} ${(patient as any).last_name || (patient as any).lastName || ''}`.trim().replace(/\s+/g, ' ')
          : `Patient #${apt.patient_id}`;

        return {
          ...apt,
          patient_name: patientName,
          patient_gender: patient ? (patient as any).gender : null,
          patient_dob: patient ? (patient as any).dob : null,
          patient_phone: patient ? (patient as any).phone : null,
          patient_age: patient ? calculateAge((patient as any).dob) : null,
          appointment_type_name: appointmentType ? (appointmentType as any).name : apt.appointment_type_custom || 'General',
          type_emoji: appointmentType ? (appointmentType as any).emoji : '📅',
          type_color: appointmentType ? (appointmentType as any).color : '#3B82F6',
          booked_by_name: bookedByStaff
            ? `${(bookedByStaff as any).title || ''} ${(bookedByStaff as any).firstName} ${(bookedByStaff as any).lastName}`.trim()
            : null,
        };
      })
    );

    res.json(enrichedAppointments);
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
});

// GET single appointment
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const apt = await Appointment.findByPk(req.params.id);
    if (!apt) return res.status(404).json({ message: "Appointment not found" });
    res.json(apt);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch appointment", error: error.message });
  }
});

// POST create appointment
router.post("/", async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Failed to create appointment", error: error.message });
  }
});

// PATCH update appointment (partial update)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const apt = await Appointment.findByPk(req.params.id);
    if (!apt) return res.status(404).json({ message: "Appointment not found" });
    await apt.update(req.body);
    res.json(apt);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update appointment", error: error.message });
  }
});

// PUT update appointment (full update)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const apt = await Appointment.findByPk(req.params.id);
    if (!apt) return res.status(404).json({ message: "Appointment not found" });
    await apt.update(req.body);
    res.json(apt);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update appointment", error: error.message });
  }
});

// DELETE appointment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const apt = await Appointment.findByPk(req.params.id);
    if (!apt) return res.status(404).json({ message: "Appointment not found" });
    await apt.destroy();
    res.json({ message: "Appointment deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete appointment", error: error.message });
  }
});

export default router;
