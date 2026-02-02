import { Router, Request, Response } from "express";
import { Staff } from "../models/Staff";
import { User } from "../models/User"; // Assuming User model is available
import bcrypt from "bcryptjs";
import { sendOtp, verifyOtp, isEmailRegistered, clearOtp } from "../otpService";

const router = Router();

// Utility function for email validation
const isValidEmail = (email: any): boolean => {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// NEW: OTP Request Endpoint
router.post("/request-otp", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    // 1. Check if email is already registered
    const isRegistered = await isEmailRegistered(email);
    if (isRegistered) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    // 2. Send the OTP
    await sendOtp(email);

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (error: any) {
    console.error("❌ Error requesting OTP:", error);
    // Return the specific error message from sendOtp for better user feedback
    return res.status(500).json({ message: error.message || "Failed to send OTP. Please try again." });
  }
});

// CREATE (Requires OTP)
router.post("/", async (req: Request, res: Response) => {
  const { otp, ...payload } = req.body; // Extract OTP from payload

  console.log("📥 POST /api/staff");
  console.log("➡️ Request body:", req.body);

  // Basic validation
  if (!payload.email || !payload.username || !payload.password || !otp) {
    return res.status(400).json({ message: "Missing required fields (email, username, password, or OTP)." });
  }

  if (!isValidEmail(payload.email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  try {
    // 1. Verify the OTP
    const isOtpValid = verifyOtp(payload.email, otp);
    if (!isOtpValid) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    // 2. Check for existing user (email uniqueness in User table)
    const existingUser = await User.findOne({
      where: {
        email: payload.email,
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    // 3. Check for existing staff with same username
    const existingStaffByUsername = await Staff.findOne({
      where: {
        username: payload.username,
      },
    });

    if (existingStaffByUsername) {
      return res.status(409).json({ message: `Username "${payload.username}" is already taken. Please choose a different username.` });
    }

    // 4. Check for existing staff with same email
    const existingStaffByEmail = await Staff.findOne({
      where: {
        email: payload.email,
      },
    });

    if (existingStaffByEmail) {
      return res.status(409).json({ message: `Email "${payload.email}" is already registered as staff.` });
    }

    // 5. Hash the password
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    // 6. Create the Staff record
    const staff = await Staff.create(payload);

    // 7. Create the corresponding User record for authentication
    await User.create({
      name: `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    });

    // 8. Clear OTP after successful registration
    clearOtp(payload.email);

    // 9. Return the created staff record (excluding password)
    const staffJson = staff.toJSON() as any;
    delete staffJson.password;

    console.log("✅ Staff created successfully:", staffJson.id);
    res.status(201).json(staffJson);
  } catch (error: any) {
    console.error("❌ Create staff error:", error);
    // Clear OTP on failure to prevent a successful registration from using a failed OTP
    clearOtp(payload.email);

    // Handle specific Sequelize errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'field';
      const value = error.errors?.[0]?.value || '';

      if (field === 'username') {
        return res.status(409).json({ message: `Username "${value}" is already taken. Please choose a different username.` });
      }
      if (field === 'email') {
        return res.status(409).json({ message: `Email "${value}" is already registered.` });
      }
      return res.status(409).json({ message: `${field} "${value}" already exists.` });
    }

    res.status(500).json({ message: "Failed to create staff", details: error.message });
  }
});

// GET all
router.get("/", async (_req: Request, res: Response) => {
  try {
    const staffList = await Staff.findAll();
    res.json(staffList);
  } catch (error: any) {
    console.error("❌ Fetch all staff error:", error);
    res.status(500).json({ message: "Failed to fetch staff", details: error.message });
  }
});

// GET by id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json(staff);
  } catch (error: any) {
    console.error("❌ Fetch staff error:", error);
    res.status(500).json({ message: "Failed to fetch staff", details: error.message });
  }
});

// FULL UPDATE (PUT)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await staff.update(updates);
    res.json(staff);
  } catch (error: any) {
    console.error("❌ Full update error:", error);
    res.status(500).json({ message: "Failed to update staff", details: error.message });
  }
});

// PARTIAL UPDATE (PATCH)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    await staff.update(updates);
    res.json(staff);
  } catch (error: any) {
    console.error("❌ Partial update error:", error);
    res.status(500).json({ message: "Failed to update staff", details: error.message });
  }
});

// DELETE
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff member not found" });

    await staff.destroy();
    res.json({ message: "Staff member deleted successfully" });
  } catch (error: any) {
    console.error("❌ Delete staff error:", error);
    res.status(500).json({ message: "Failed to delete staff", details: error.message });
  }
});

export default router;
