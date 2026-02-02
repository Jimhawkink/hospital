import { Router, Request, Response } from "express";
import Product from "../models/Product";

const router = Router();

/**
 * GET all products (stocks)
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    console.log("📦 GET /api/stock - Fetching all products");
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * POST new product
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("➕ POST /api/stock - Adding new product:", req.body);

    const {
      productName,
      productType,
      sku,
      availableqty,
      category,
      basePackage,
      unitsPerPackage,
      buyingprice,
      sellingPrice,
      availableOnPOS,
      minStockNotification,
      expiryDate,
      batchNo,
    } = req.body;

    if (!productName || !productType || !category || !basePackage || !unitsPerPackage || !sellingPrice) {
      return res.status(400).json({
        error:
          "Missing required fields: productName, productType, category, basePackage, unitsPerPackage, sellingPrice",
      });
    }

    const newProduct = await Product.create({
      productName,
      productType,
      sku,
      availableqty,
      category,
      basePackage,
      unitsPerPackage: Number(unitsPerPackage),
      sellingPrice: Number(sellingPrice),
      buyingprice: Number(buyingprice),
      availableOnPOS: availableOnPOS ?? true,
      minStockNotification: minStockNotification ?? 0,
      expiryDate,
      batchNo,
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("❌ Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

/**
 * PUT update product
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    console.log("📝 PUT /api/stock/:id - Updating product:", req.params.id, "with body:", req.body);

    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Log the current state before update
    console.log("📦 Current product data:", product.toJSON());

    await product.update(req.body); // Update with the provided body

    // Fetch and log the updated state
    const updatedProduct = await Product.findByPk(id);
    console.log("📦 Updated product data:", updatedProduct?.toJSON());

    res.json(updatedProduct);
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

/**
 * DELETE product
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    console.log("🗑️ DELETE /api/stock/:id - Deleting product:", req.params.id);

    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await product.destroy();
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;