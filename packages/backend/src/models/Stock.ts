import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";
import Package from "./Package";

class Stock extends Model {
  public id!: string;
  public name!: string;
  public sku?: string;
  public category!: string;
  public quantity!: number;
  public availableUnits!: number;
  public status!: "available" | "out-of-stock" | "low-stock";
  public expiryDate?: string;
  public batchNo?: string;
  public sellingPrice?: number;
}

Stock.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    availableUnits: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM("available", "out-of-stock", "low-stock"), allowNull: false },
    expiryDate: { type: DataTypes.STRING },
    batchNo: { type: DataTypes.STRING },
    sellingPrice: { type: DataTypes.FLOAT },
  },
  {
    sequelize,
    tableName: "stocks",
    timestamps: true,
  }
);

Stock.hasMany(Package, { foreignKey: "stockId", as: "packages" });

export default Stock;
