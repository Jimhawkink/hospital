import { Router } from "express";
import Invoice from "../models/Invoice";
import Payment from "../models/Payment";
import Patient from "../models/Patient";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const invoices = await Invoice.findAll({ include: [Patient, Payment] });
  res.json(invoices);
});

router.get("/:id", async (req, res) => {
  const invoice = (await Invoice.findByPk(req.params.id, { include: [Payment, Patient] })) as Invoice | null;
  if (!invoice) return res.status(404).json({ message: "Not found" });
  res.json(invoice);
});

router.post("/", async (req, res) => {
  const inv = (await Invoice.create(req.body)) as Invoice;
  res.status(201).json(inv);
});

router.post("/:id/pay", async (req, res) => {
  const invoice = (await Invoice.findByPk(req.params.id)) as Invoice | null;
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  const { amount, method, transaction_code } = req.body;

  const payment = (await Payment.create({
    invoice_id: invoice.id,
    amount,
    method,
    transaction_code,
  })) as Payment;

  const payments = (await Payment.findAll({
    where: { invoice_id: invoice.id },
  })) as Payment[];

  const paidTotal = payments.reduce((s, p) => s + Number(p.amount), 0);

  if (Number(paidTotal) >= Number(invoice.amount)) {
    await invoice.update({ status: "paid" });
  } else {
    await invoice.update({ status: "partially_paid" });
  }

  res.status(201).json(payment);
});

router.put("/:id", async (req, res) => {
  const inv = (await Invoice.findByPk(req.params.id)) as Invoice | null;
  if (!inv) return res.status(404).json({ message: "Not found" });
  await inv.update(req.body);
  res.json(inv);
});

router.delete("/:id", async (req, res) => {
  const inv = (await Invoice.findByPk(req.params.id)) as Invoice | null;
  if (!inv) return res.status(404).json({ message: "Not found" });
  await inv.destroy();
  res.json({ message: "Deleted" });
});

export default router;
