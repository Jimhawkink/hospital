import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

class PaymentMethod extends Model {
  public id!: number;
  public name!: string;
  public active_on_pos!: boolean;
  public transaction_code!: boolean;
  public enabled!: boolean;
  public organisation_id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PaymentMethod.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active_on_pos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    transaction_code: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    organisation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "hms_payment_methods",
    modelName: "PaymentMethod",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export { PaymentMethod };
export default PaymentMethod;