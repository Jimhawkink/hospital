import { Router } from "express";
import POSSale from "../models/POSSale";
import POSSaleItem from "../models/POSSaleItem";
import Patient from "../models/Patient";
import Stock from "../models/Stock";
import { sequelize } from "../config/db";

const router = Router();

// Get all sales
router.get("/", async (req, res) => {
    try {
        const sales = await POSSale.findAll({
            include: [
                { model: POSSaleItem, as: "items" },
                { model: Patient, as: "patient" }
            ],
            order: [["created_at", "DESC"]]
        });
        res.json(sales);
    } catch (error) {
        console.error("Error fetching sales:", error);
        res.status(500).json({ error: "Failed to fetch sales" });
    }
});

// Create a new sale
router.post("/", async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { patient_id, encounter_id, items, payment_method, amount_tendered, change_due, notes } = req.body;

        let subtotal = 0;
        let tax_total = 0;
        let discount_total = 0;
        let total_amount = 0;

        const processedItems = items.map((item: any) => {
            const quantity = Number(item.quantity) || 1;
            const unit_price = Number(item.unit_price) || 0;
            const tax_rate = Number(item.tax_rate) || 0;
            const discount = Number(item.discount_amount) || 0;

            const line_gross = unit_price * quantity;
            const line_subtotal = Math.max(0, line_gross - discount);
            const line_tax = line_subtotal * (tax_rate / 100);
            const line_total = line_subtotal + line_tax;

            subtotal += line_subtotal;
            tax_total += line_tax;
            discount_total += discount;
            total_amount += line_total;

            return {
                product_id: item.product_id || item.productID,
                product_name: item.product_name || item.productName,
                quantity,
                unit_price,
                tax_rate,
                tax_amount: line_tax,
                discount_amount: discount,
                subtotal: line_total,
            };
        });

        // Generate simple receipt number
        const receipt_no = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const sale = await POSSale.create({
            receipt_no,
            patient_id: patient_id || null,
            subtotal,
            tax_total,
            discount_total,
            total_amount,
            amount_tendered: Number(amount_tendered) || 0,
            change_due: Number(change_due) || 0,
            payment_method,
            status: "Completed",
            notes
        }, { transaction: t });

        // Create sale items
        if (processedItems.length > 0) {
            await POSSaleItem.bulkCreate(processedItems.map((item: any) => ({
                sale_id: sale.id,
                ...item
            })), { transaction: t });

            // Deduct stock for each item sold
            for (const item of processedItems) {
                const stockItem = await Stock.findByPk(item.product_id);
                if (stockItem) {
                    await stockItem.decrement('availableUnits', { by: item.quantity, transaction: t });
                }
            }
        }
        await t.commit();

        // Fetch full sale with items AND patient for the receipt
        const fullSale = await POSSale.findByPk(sale.id, {
            include: [
                { model: POSSaleItem, as: "items" },
                { model: Patient, as: "patient" }
            ]
        });

        res.status(201).json(fullSale);
    } catch (error) {
        await t.rollback();
        console.error("Error creating sale:", error);
        res.status(500).json({ error: "Failed to create sale" });
    }
});

// Get single sale
router.get("/:id", async (req, res) => {
    try {
        const sale = await POSSale.findByPk(req.params.id, {
            include: [
                { model: POSSaleItem, as: "items" },
                { model: Patient, as: "patient" }
            ]
        });
        if (!sale) return res.status(404).json({ error: "Sale not found" });
        res.json(sale);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sale" });
    }
});

export default router;
