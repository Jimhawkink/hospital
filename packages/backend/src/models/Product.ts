// src/models/Product.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db"; // Changed from ../config/database to ../config/db

class Product extends Model {
  public id!: string; // Use string for UUID
  public productName!: string;
  public productType!: string;
  public sku?: string;
  public availableqty!: number;
  public category!: string;
  public basePackage!: string;
  public unitsPerPackage!: number;
  public buyingprice!: number;
  public sellingPrice!: number;
  public availableOnPOS!: boolean;
  public minStockNotification!: number;
  public expiryDate?: Date;
  public batchNo?: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.STRING, // Use STRING to match frontend UUID
      primaryKey: true,
      allowNull: false,
    },
    productName: { type: DataTypes.STRING, allowNull: false, field: 'product_name' },
    productType: { type: DataTypes.STRING, allowNull: false, defaultValue: "Medicine", field: 'product_type' },
    sku: { type: DataTypes.STRING, allowNull: true },
    availableqty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'available_qty' },
    category: { type: DataTypes.STRING, allowNull: false },
    basePackage: { type: DataTypes.STRING, allowNull: false, defaultValue: "unit", field: 'base_package' },
    unitsPerPackage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'units_per_package' },
    buyingprice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, field: 'buying_price' },
    sellingPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, field: 'selling_price' },
    availableOnPOS: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'available_on_pos' },
    minStockNotification: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'min_stock_notification' },
    expiryDate: { type: DataTypes.DATE, allowNull: true, field: 'expiry_date' },
    batchNo: { type: DataTypes.STRING, allowNull: true, field: 'batch_no' },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "hms_products",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Product;

