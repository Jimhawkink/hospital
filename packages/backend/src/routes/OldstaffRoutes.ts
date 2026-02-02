import { Router } from "express";

const router = Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Staff routes working!" });
});

// Get all staff
router.get("/", async (req, res) => {
  try {
    const Staff = (await import("../models/Staff")).default;
    const staff = await Staff.findAll();
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff
router.post("/", async (req, res) => {
  try {
    const Staff = (await import("../models/Staff")).default;
    const staff = await Staff.create(req.body);
    res.status(201).json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;