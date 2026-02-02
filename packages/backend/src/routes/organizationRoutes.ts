import { Router } from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import { Organization } from "../models/Organization";

const router = Router();

// Ensure uploads dir exists
const uploadsRoot = path.join(process.cwd(), "uploads");
const orgDir = path.join(uploadsRoot, "organization");
if (!fs.existsSync(orgDir)) fs.mkdirSync(orgDir, { recursive: true });

// Multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, orgDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `logo_${Date.now()}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// GET current settings (single-row config, id=1)
router.get("/settings", async (_req, res) => {
  try {
    const row = await Organization.findByPk(1);
    res.json(row ?? {});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load organisation settings" });
  }
});

// UPSERT settings (id=1)
router.put("/settings", async (req, res) => {
  try {
    const payload = req.body ?? {};
    // guarantee single row
    await Organization.upsert({ id: 1, ...payload });
    const saved = await Organization.findByPk(1);
    res.json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save organisation settings" });
  }
});

// Upload logo -> returns URL to store as logo_url
router.post("/upload-logo", upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/organization/${req.file.filename}`;
    res.json({ url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to upload logo" });
  }
});

export default router;
