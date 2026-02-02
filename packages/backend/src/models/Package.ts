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
    sellingPrice: { type: DataTypes.FLOAT, allowNull: false },
    unitsPerPack: { type: DataTypes.INTEGER, allowNull: false },
    availableForPurchase: { type: DataTypes.BOOLEAN, defaultValue: true },
    stockId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    tableName: "hms_packages",
    timestamps: true,
  }
);

export { Package };
export default Package;
