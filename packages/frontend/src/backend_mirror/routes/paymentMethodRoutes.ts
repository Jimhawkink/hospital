// routes/paymentMethodRoutes.ts
import express, { Request, Response } from "express";
import PaymentMethod from "../models/PaymentMethod";
// Note: If 'express-validator' import issues persist, ensure:
// 1. Run: npm install express-validator in your backend directory
// 2. In tsconfig.json, add or ensure: "esModuleInterop": true
// 3. If still failing, use the alternative without validation below the code
import { body, validationResult } from "express-validator";

const router = express.Router();

// Helper to convert various truthy values to boolean
const toBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
};

// Validation middleware for POST and PUT
const validatePaymentMethod = [
  body("name").notEmpty().withMessage("Name is required").trim(),
  // Accept any value for these - we'll convert in the handler
  body("active_on_pos").optional(),
  body("transaction_code").optional(),
  body("enabled").optional(),
  body("organisation_id").optional({ nullable: true }),
  body("active").optional(), // Ignore the 'active' field if sent
];

// GET all payment methods
router.get("/", async (req: Request, res: Response) => {
  try {
    const methods = await PaymentMethod.findAll();
    console.log(`✅ Fetched ${methods.length} payment methods`);
    res.json(methods);
  } catch (err: any) {
    console.error("❌ Error fetching payment methods:", err.message, err.stack);
    res.status(500).json({ error: "Failed to fetch payment methods", details: err.message });
  }
});

// CREATE payment method
router.post("/", validatePaymentMethod, async (req: Request, res: Response) => {
  console.log("📥 POST /api/organization/payment-methods");
  console.log("➡️ Request body:", req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, active_on_pos, transaction_code, enabled, organisation_id } = req.body;

    const newMethod = await PaymentMethod.create({
      name: name?.trim() || name,
      active_on_pos: toBoolean(active_on_pos),
      transaction_code: toBoolean(transaction_code),
      enabled: enabled !== undefined ? toBoolean(enabled) : true,
      organisation_id: organisation_id ?? null,
    });

    console.log("✅ Created payment method:", newMethod.toJSON());
    res.status(201).json(newMethod);
  } catch (err: any) {
    console.error("❌ Error saving payment method:", err.message, err.stack);
    if (err.name === 'SequelizeDatabaseError') {
      console.error("Sequelize error details:", err.parent?.sqlMessage || err.parent?.message);
    }
    res.status(500).json({ error: "Failed to save payment method", details: err.message });
  }
});

// UPDATE payment method
router.put("/:id", validatePaymentMethod, async (req: Request, res: Response) => {
  console.log("📥 PUT /api/organization/payment-methods/:id");
  console.log("➡️ Request body:", req.body);

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, active_on_pos, transaction_code, enabled, organisation_id } = req.body;

    const method = await PaymentMethod.findByPk(id);
    if (!method) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    await method.update({
      name: name?.trim() || method.name,
      active_on_pos: active_on_pos !== undefined ? toBoolean(active_on_pos) : method.active_on_pos,
      transaction_code: transaction_code !== undefined ? toBoolean(transaction_code) : method.transaction_code,
      enabled: enabled !== undefined ? toBoolean(enabled) : method.enabled,
      organisation_id: organisation_id ?? method.organisation_id,
    });

    console.log("✅ Updated payment method:", method.toJSON());
    res.json(method);
  } catch (err: any) {
    console.error("❌ Error updating payment method:", err.message, err.stack);
    res.status(500).json({ error: "Failed to update payment method", details: err.message });
  }
});

// DELETE payment method
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const method = await PaymentMethod.findByPk(id);
    if (!method) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    await method.destroy();
    console.log(`Deleted payment method with id: ${id}`);
    res.json({ message: "Payment method deleted successfully" });
  } catch (err: any) {
    console.error("❌ Error deleting payment method:", err.message, err.stack);
    res.status(500).json({ error: "Failed to delete payment method", details: err.message });
  }
});

export default router;