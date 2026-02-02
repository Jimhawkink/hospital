import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import PaymentMethod from "./PaymentMethod";

export interface OrganizationAttributes {
  id: number;
  organisation_name: string;
  country: string;
  city: string;
  county: string;
  sub_county: string;
  ward: string;
  town: string;
  logo_path: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type OrganizationCreation = Optional<OrganizationAttributes, "id">;

class OrganizationSetting
  extends Model<OrganizationAttributes, OrganizationCreation>
  implements OrganizationAttributes {
  public id!: number;
  public organisation_name!: string;
  public country!: string;
  public city!: string;
  public county!: string;
  public sub_county!: string;
  public ward!: string;
  public town!: string;
  public logo_path!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrganizationSetting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisation_name: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    county: { type: DataTypes.STRING, allowNull: false },
    sub_county: { type: DataTypes.STRING, allowNull: false },
    ward: { type: DataTypes.STRING, allowNull: false },
    town: { type: DataTypes.STRING, allowNull: false },
    logo_path: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: "organisation_settings",
    modelName: "OrganizationSetting",
    timestamps: true,
  }
);

OrganizationSetting.hasMany(PaymentMethod, {
  foreignKey: "organization_id",
  as: "payment_methods",
});
PaymentMethod.belongsTo(OrganizationSetting, {
  foreignKey: "organization_id",
  as: "organization",
});

export { OrganizationSetting };
export default OrganizationSetting;
