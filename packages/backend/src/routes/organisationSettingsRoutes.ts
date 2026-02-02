import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { OrganisationSetting } from "../models/OrganisationSetting";

const router = express.Router();

// ----------------------
// Multer config for file upload
// ----------------------
const uploadDir = path.join(__dirname, "../../Uploads/logos");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.fieldname + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ----------------------
// Helper to build full logo URL
// ----------------------
const buildLogoUrl = (req: express.Request, logoPath: string | null) => {
  if (!logoPath) return null;
  return `${req.protocol}://${req.get("host")}${logoPath}?t=${Date.now()}`;
};

// ----------------------
// POST /save - create or update
// ----------------------
router.post("/save", upload.single("logo"), async (req, res) => {
  try {
    const {
      organisation_name,
      country,
      city,
      county,
      sub_county,
      ward,
      town,
      phone,
      email,
      address,
      payment_method_id,
    } = req.body;

    const logo_path = req.file ? `/Uploads/logos/${req.file.filename}` : null;

    let settings = await OrganisationSetting.findOne();
    if (settings) {
      await settings.update({
        organisation_name,
        country,
        city,
        county,
        sub_county,
        ward,
        town,
        phone,
        email,
        address,
        payment_method_id: payment_method_id || null,
        logo_url: logo_path || settings.logo_url,
      });
    } else {
      settings = await OrganisationSetting.create({
        organisation_name,
        country,
        city,
        county,
        sub_county,
        ward,
        town,
        phone,
        email,
        address,
        payment_method_id: payment_method_id || null,
        logo_url: logo_path,
      });
    }

    const settingsJson = settings.toJSON();
    return res.status(200).json({
      ...settingsJson,
      logo_url: buildLogoUrl(req, settingsJson.logo_url ?? null),
    });
  } catch (err: any) {
    console.error("❌ Error saving organisation settings:", err.message, err);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------
// GET / - fetch settings
// ----------------------
router.get("/", async (req, res) => {
  try {
    const settings = await OrganisationSetting.findOne();
    if (!settings) return res.status(200).json(null);

    const settingsJson = settings.toJSON();
    return res.status(200).json({
      ...settingsJson,
      logo_url: buildLogoUrl(req, settingsJson.logo_url ?? null),
    });
  } catch (err: any) {
    console.error("❌ Error fetching organisation settings:", err.message, err);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------
// DELETE /discard - delete all settings
// ----------------------
router.delete("/discard", async (_req, res) => {
  try {
    await OrganisationSetting.destroy({ where: {} });
    return res.status(200).json({ message: "Organisation settings discarded" });
  } catch (err: any) {
    console.error("❌ Error discarding organisation settings:", err.message, err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
