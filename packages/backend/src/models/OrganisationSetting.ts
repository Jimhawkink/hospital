import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import PaymentMethod from "./PaymentMethod";

class OrganisationSetting extends Model {
  public id!: number;
  public organisation_name!: string;
  public logo_url!: string;
  public logo_path!: string | null;
  public email!: string;
  public phone!: string;
  public address!: string;
  public payment_method_id!: number;

  public country!: string;
  public city!: string;
  public town!: string;
  public county!: string;
  public sub_county!: string;
  public ward!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrganisationSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    organisation_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    town: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sub_county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ward: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "hms_organisation_settings",
    modelName: "OrganisationSetting",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

OrganisationSetting.belongsTo(PaymentMethod, {
  foreignKey: "payment_method_id",
  as: "paymentMethod",
});

export { OrganisationSetting };
export default OrganisationSetting;
