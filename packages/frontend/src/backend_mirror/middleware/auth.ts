import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export interface JwtPayloadCustom {
  id: number;
  role: string;
  name?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers["authorization"];
  const token = header && typeof header === "string" ? header.split(" ")[1] : null;
  if (!token) return res.status(401).json({ message: "Unauthorized: no token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as JwtPayloadCustom;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
