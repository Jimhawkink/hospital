// src/routes/stockRoutes.ts
import express, { Request, Response } from "express";
import Stock from "../models/Stock";
import Package from "../models/Package";
import { Op } from "sequelize";

const router = express.Router();

// =============================
// GET all stock with packages
// =============================
router.get("/", async (_req: Request, res: Response) => {
  try {
    const stocks = await Stock.findAll({
      include: [{ model: Package, as: "packages" }],
    });
    res.json(stocks);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: "Error fetching stock" });
  }
});

// =============================
// GET single stock by ID
// =============================
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const stock = await Stock.findByPk(req.params.id, {
      include: [{ model: Package, as: "packages" }],
    });
    if (!stock) return res.status(404).json({ message: "Stock not found" });
    res.json(stock);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: "Error fetching stock" });
  }
});

// =============================
// CREATE stock with optional packages
// =============================
router.post("/", async (req: Request, res: Response) => {
  try {
    const { packages, ...stockData } = req.body;

    // Create stock
    const stock = await Stock.create(stockData);

    // If packages provided, create them linked to stock
    if (Array.isArray(packages)) {
      const packagesToCreate = packages.map((p: any) => ({
        ...p,
        stockId: stock.id,
      }));
      await Package.bulkCreate(packagesToCreate);
    }

    // Reload stock with packages
    const result = await Stock.findByPk(stock.id, {
      include: [{ model: Package, as: "packages" }],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating stock:", error);
    res.status(500).json({ message: "Error creating stock" });
  }
});

// =============================
// UPDATE stock with optional packages
// =============================
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const stock = await Stock.findByPk(req.params.id, {
      include: [{ model: Package, as: "packages" }],
    });
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    const { packages, ...stockData } = req.body;

    // Update stock data
    await stock.update(stockData);

    // Update packages if provided
    if (Array.isArray(packages)) {
      // Delete old packages
      await Package.destroy({ where: { stockId: stock.id } });

      // Add new packages
      const packagesToCreate = packages.map((p: any) => ({
        ...p,
        stockId: stock.id,
      }));
      await Package.bulkCreate(packagesToCreate);
    }

    // Reload updated stock
    const result = await Stock.findByPk(stock.id, {
      include: [{ model: Package, as: "packages" }],
    });

    res.json(result);
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Error updating stock" });
  }
});

// =============================
// DELETE stock and its packages
// =============================
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const stock = await Stock.findByPk(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    // Delete packages first
    await Package.destroy({ where: { stockId: stock.id } });

    // Delete stock
    await stock.destroy();

    res.json({ message: "Stock deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock:", error);
    res.status(500).json({ message: "Error deleting stock" });
  }
});

export default router;
