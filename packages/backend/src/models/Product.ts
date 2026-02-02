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
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Medicine",
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    availableqty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    basePackage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "unit",
    },
    unitsPerPackage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    buyingprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    sellingPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    availableOnPOS: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    minStockNotification: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    batchNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
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
    tableName: "Products",
    timestamps: true,
  }
);

export default Product;

