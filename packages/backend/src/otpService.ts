import crypto from "crypto";
import nodemailer from "nodemailer";
import { User } from "./models/User"; // Assuming User model is available

// ----------------------------------------------------------------
// NOTE: This file is being imported early. We must ensure that 
// environment variables are available before creating the transporter.
// If your main server.ts already calls dotenv.config(), this is a 
// safety net against early imports.
// ----------------------------------------------------------------
import dotenv from "dotenv";
import path from "path";
// Attempt to load .env again, specifically for this file's initialization
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration for the email service
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌ CRITICAL: EMAIL_USER or EMAIL_PASS is missing in environment variables.");
  console.error("⚠️  OTP service will not be able to send emails. Please check your .env file.");
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: EMAIL_USER, // Your email address
    pass: EMAIL_PASS, // Your app-specific password (for Gmail)
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates in development
  },
});

// Verify transporter configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email transporter configuration error:", error);
    console.error("⚠️  Please check your EMAIL_USER and EMAIL_PASS environment variables");
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

// Interface for the OTP record
interface OtpRecord {
  otp: string;
  expiresAt: Date;
}

// In-memory store for OTPs (replace with Redis or database in production)
// Key: email address, Value: { otp: string, expiresAt: Date }
const otpStore = new Map<string, OtpRecord>();

// OTP expiration time in milliseconds (e.g., 5 minutes)
const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generates a 6-digit numeric OTP.
 * @returns {string} The generated OTP.
 */
const generateOtp = (): string => {
  // Generate a random 6-digit number and pad with leading zeros
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

/**
 * Sends an OTP to the specified email address and stores it.
 * @param {string} email - The recipient's email address.
 * @returns {Promise<void>}
 */
export const sendOtp = async (email: string): Promise<void> => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("OTP service is not configured. Missing EMAIL_USER or EMAIL_PASS.");
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // 1. Store the OTP
  otpStore.set(email, { otp, expiresAt });

  // 2. Send the email
  try {
    const info = await transporter.sendMail({
      from: `"Hospital Management System" <${EMAIL_USER}>`,
      to: email,
      subject: "Your One-Time Password (OTP) for Staff Registration",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .otp-box { background-color: white; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
            .warning { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Staff Registration OTP</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to register a new staff member in the Hospital Management System.</p>
              <p>Your One-Time Password (OTP) is:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in <span class="warning">5 minutes</span></li>
                <li>Do not share this code with anyone</li>
                <li>If you did not request this, please ignore this email</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is an automated message from Hospital Management System</p>
              <p>&copy; ${new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello,

Your One-Time Password (OTP) for staff registration is: ${otp}

This code will expire in 5 minutes.

If you did not request this, please ignore this email.

---
Hospital Management System
      `,
    });

    console.log("✅ OTP email sent successfully: %s", info.messageId);

    // Preview only available when sending through an Ethereal account
    if (process.env.NODE_ENV !== 'production' && process.env.EMAIL_HOST === 'smtp.ethereal.email') {
      console.log("📧 Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Authentication failed") || error.message.includes("535")) {
        throw new Error("Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS credentials.");
      } else if (error.message.includes("ECONNREFUSED")) {
        throw new Error("Cannot connect to email server. Please check your EMAIL_HOST and EMAIL_PORT settings.");
      } else {
        throw new Error(`Failed to send OTP email: ${error.message}`);
      }
    }

    throw new Error("Failed to send OTP email. Please contact system administrator.");
  }
};

/**
 * Verifies the provided OTP against the stored one.
 * @param {string} email - The user's email address.
 * @param {string} otp - The OTP provided by the user.
 * @returns {boolean} True if the OTP is valid and not expired, false otherwise.
 */
export const verifyOtp = (email: string, otp: string): boolean => {
  const record = otpStore.get(email);

  if (!record) {
    console.log(`❌ No OTP found for email: ${email}`);
    return false; // No OTP found for this email
  }

  if (record.expiresAt < new Date()) {
    // OTP expired, remove it
    console.log(`⏰ OTP expired for email: ${email}`);
    otpStore.delete(email);
    return false;
  }

  if (record.otp === otp) {
    // OTP is valid, remove it to prevent reuse
    console.log(`✅ OTP verified successfully for email: ${email}`);
    otpStore.delete(email);
    return true;
  }

  console.log(`❌ Invalid OTP for email: ${email}`);
  return false;
};

/**
 * Checks if an email is already registered.
 * @param {string} email - The email address to check.
 * @returns {Promise<boolean>} True if the email is already in the database, false otherwise.
 */
export const isEmailRegistered = async (email: string): Promise<boolean> => {
  // Assuming the User model has a findOne method and 'email' field
  const user = await User.findOne({ where: { email } });
  return !!user;
};

/**
 * Clears the OTP for a given email. Useful for cleanup or on successful registration.
 * @param {string} email - The user's email address.
 */
export const clearOtp = (email: string): void => {
  otpStore.delete(email);
  console.log(`🗑️  OTP cleared for email: ${email}`);
};
