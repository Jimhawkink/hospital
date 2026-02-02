import { Router, Request, Response } from "express";
import { AppointmentType } from "../models/AppointmentType";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET all appointment types
router.get("/", async (req: Request, res: Response) => {
    try {
        const types = await AppointmentType.findAll({
            where: { is_active: true },
            order: [["sort_order", "ASC"]],
        });
        res.json(types);
    } catch (error: any) {
        console.error("Error fetching appointment types:", error);
        res.status(500).json({ message: "Failed to fetch appointment types", error: error.message });
    }
});

// GET single appointment type
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const type = await AppointmentType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ message: "Appointment type not found" });
        res.json(type);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch appointment type", error: error.message });
    }
});

// POST create appointment type
router.post("/", async (req: Request, res: Response) => {
    try {
        const type = await AppointmentType.create(req.body);
        res.status(201).json(type);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to create appointment type", error: error.message });
    }
});

// PUT update appointment type
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const type = await AppointmentType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ message: "Appointment type not found" });
        await type.update(req.body);
        res.json(type);
    } catch (error: any) {
        res.status(500).json({ message: "Failed to update appointment type", error: error.message });
    }
});

// DELETE appointment type (soft delete by setting is_active = false)
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const type = await AppointmentType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ message: "Appointment type not found" });
        await type.update({ is_active: false });
        res.json({ message: "Appointment type deactivated" });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to delete appointment type", error: error.message });
    }
});

export default router;
