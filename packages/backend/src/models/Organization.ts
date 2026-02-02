import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface OrganizationAttributes {
  id: number;
  organisation_name: string | null;
  country: string | null;
  city: string | null;
  county: string | null;
  sub_county: string | null;
  ward: string | null;
  town: string | null;
  logo_path: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type OrganizationCreation = Optional<OrganizationAttributes, "id">;

class Organization
  extends Model<OrganizationAttributes, OrganizationCreation>
  implements OrganizationAttributes {
  public id!: number;
  public organisation_name!: string | null;
  public country!: string | null;
  public city!: string | null;
  public county!: string | null;
  public sub_county!: string | null;
  public ward!: string | null;
  public town!: string | null;
  public logo_path!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Organization.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    organisation_name: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    county: { type: DataTypes.STRING, allowNull: true },
    sub_county: { type: DataTypes.STRING, allowNull: true },
    ward: { type: DataTypes.STRING, allowNull: true },
    town: { type: DataTypes.STRING, allowNull: true },
    logo_path: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    tableName: "organisation_settings",
    modelName: "Organization",
    timestamps: true,
  }
);

export { Organization };
export default Organization;
