import { Router } from "express";
import User from "../models/User";
import Staff from "../models/Staff";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const user: any = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || "secret", { expiresIn: "1d" });

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export default router;

export default router;
