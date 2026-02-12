import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

// ======================
// Staff Attributes
// ======================
export interface StaffAttributes {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  jobTitle: string;
  username: string;
  password: string;
  addedOn?: Date | null;
  activeStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional fields for creation
export type StaffCreationAttributes = Optional<
  StaffAttributes,
  "id" | "addedOn" | "activeStatus" | "createdAt" | "updatedAt"
>;

// ======================
// Staff Model
// ======================
class Staff
  extends Model<StaffAttributes, StaffCreationAttributes>
  implements StaffAttributes {
  public id!: number;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public gender!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public role!: string;
  public jobTitle!: string;
  public username!: string;
  public password!: string;
  public addedOn?: Date | null;
  public activeStatus!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// ======================
// Sequelize Init
// ======================
Staff.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING(50), allowNull: false },
    firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
    gender: { type: DataTypes.STRING(20), allowNull: false },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { name: "unique_staff_email", msg: "Email must be unique" },
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING(50), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(50), allowNull: false },
    jobTitle: { type: DataTypes.STRING(100), allowNull: false },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { name: "unique_staff_username", msg: "Username must be unique" },
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
    addedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    activeStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "hms_staff",
    modelName: "Staff",
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Staff;
