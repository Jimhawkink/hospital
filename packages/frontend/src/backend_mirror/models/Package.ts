import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/db";

class Package extends Model {
  public id!: string;
  public name!: string;
  public sellingPrice!: number;
  public unitsPerPack!: number;
  public availableForPurchase!: boolean;
  public stockId!: string;
}

Package.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    sellingPrice: { type: DataTypes.FLOAT, allowNull: false, field: 'selling_price' },
    unitsPerPack: { type: DataTypes.INTEGER, allowNull: false, field: 'units_per_pack' },
    availableForPurchase: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'available_for_purchase' },
    stockId: { type: DataTypes.UUID, allowNull: false, field: 'stock_id' },
  },
  {
    sequelize,
    tableName: "hms_packages",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export { Package };
export default Package;
