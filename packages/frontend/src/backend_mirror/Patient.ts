import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "./config/db";


interface PatientAttributes {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: "Male" | "Female" | "Other";
  dob: Date;
  patient_status: "Alive" | "Deceased";
  phone: string;
  email?: string;
  occupation?: string;
  heard_about_facility?: "Social Media" | "Friend" | "Google Search" | "News Rooms" | "Physical Search";
  patient_number?: string;
  sha_number?: string;
  county?: string;
  sub_county?: string;
  area_of_residence?: string;
  next_of_kin_first_name?: string;
  next_of_kin_last_name?: string;
  next_of_kin_phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type PatientCreationAttributes = Optional<PatientAttributes, "id" | "createdAt" | "updatedAt">;

class Patient extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes {
  public id!: number;
  public first_name!: string;
  public middle_name?: string;
  public last_name!: string;
  public gender!: "Male" | "Female" | "Other";
  public dob!: Date;
  public patient_status!: "Alive" | "Deceased";
  public phone!: string;
  public email?: string;
  public occupation?: string;
  public heard_about_facility?: "Social Media" | "Friend" | "Google Search" | "News Rooms" | "Physical Search";
  public patient_number?: string;
  public sha_number?: string;
  public county?: string;
  public sub_county?: string;
  public area_of_residence?: string;
  public next_of_kin_first_name?: string;
  public next_of_kin_last_name?: string;
  public next_of_kin_phone?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: { type: DataTypes.STRING, allowNull: false },
    middle_name: DataTypes.STRING,
    last_name: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.ENUM("Male", "Female", "Other"), allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    patient_status: { type: DataTypes.ENUM("Alive", "Deceased"), defaultValue: "Alive" },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: DataTypes.STRING,
    occupation: DataTypes.STRING,
    heard_about_facility: DataTypes.ENUM("Social Media", "Friend", "Google Search", "News Rooms", "Physical Search"),
    patient_number: DataTypes.STRING,
    sha_number: DataTypes.STRING,
    county: DataTypes.STRING,
    sub_county: DataTypes.STRING,
    area_of_residence: DataTypes.STRING,
    next_of_kin_first_name: DataTypes.STRING,
    next_of_kin_last_name: DataTypes.STRING,
    next_of_kin_phone: DataTypes.STRING
  },
  {
    sequelize,
    modelName: "Patient",
    tableName: "Patients",
  }
);
export { Patient };
