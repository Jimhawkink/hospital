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
    availableUnits: { type: DataTypes.INTEGER, allowNull: false, field: 'available_units' },
    status: { type: DataTypes.ENUM("available", "out-of-stock", "low-stock"), allowNull: false },
    expiryDate: { type: DataTypes.STRING, field: 'expiry_date' },
    batchNo: { type: DataTypes.STRING, field: 'batch_no' },
    sellingPrice: { type: DataTypes.FLOAT, field: 'selling_price' },
  },
  {
    sequelize,
    tableName: "hms_stock",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Stock.hasMany(Package, { foreignKey: "stockId", as: "packages" });

export default Stock;
