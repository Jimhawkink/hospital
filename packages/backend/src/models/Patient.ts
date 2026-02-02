import { DataTypes, Model, Optional } from "sequelize";
import {sequelize} from "../config/db";

interface PatientAttributes {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  dob: Date;
  patientStatus?: "Alive" | "Deceased";
  phone: string;
  email?: string;
  occupation?: string;
  heardAboutFacility?: "Social Media" | "Friend" | "Google Search" | "News Rooms" | "Physical Search";
  patientNumber?: string;
  shaNumber?: string;
  county?: string;
  subCounty?: string;
  areaOfResidence?: string;
  nextOfKinFirstName?: string;
  nextOfKinLastName?: string;
  nextOfKinPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientCreationAttributes extends Optional<PatientAttributes, "id" | "createdAt" | "updatedAt"> {}

class Patient extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes {
  public id!: number;
  public firstName!: string;
  public middleName?: string;
  public lastName!: string;
  public gender!: "Male" | "Female" | "Other";
  public dob!: Date;
  public patientStatus?: "Alive" | "Deceased";
  public phone!: string;
  public email?: string;
  public occupation?: string;
  public heardAboutFacility?: "Social Media" | "Friend" | "Google Search" | "News Rooms" | "Physical Search";
  public patientNumber?: string;
  public shaNumber?: string;
  public county?: string;
  public subCounty?: string;
  public areaOfResidence?: string;
  public nextOfKinFirstName?: string;
  public nextOfKinLastName?: string;
  public nextOfKinPhone?: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name", // maps to snake_case in DB
    },
    middleName: {
      type: DataTypes.STRING,
      field: "middle_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    patientStatus: {
      type: DataTypes.ENUM("Alive", "Deceased"),
      defaultValue: "Alive",
      field: "patient_status",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: DataTypes.STRING,
    occupation: DataTypes.STRING,
    heardAboutFacility: {
      type: DataTypes.ENUM("Social Media", "Friend", "Google Search", "News Rooms", "Physical Search"),
      field: "heard_about_facility",
    },
    patientNumber: {
      type: DataTypes.STRING,
      field: "patient_number",
    },
    shaNumber: {
      type: DataTypes.STRING,
      field: "sha_number",
    },
    county: DataTypes.STRING,
    subCounty: {
      type: DataTypes.STRING,
      field: "sub_county",
    },
    areaOfResidence: {
      type: DataTypes.STRING,
      field: "area_of_residence",
    },
    nextOfKinFirstName: {
      type: DataTypes.STRING,
      field: "next_of_kin_first_name",
    },
    nextOfKinLastName: {
      type: DataTypes.STRING,
      field: "next_of_kin_last_name",
    },
    nextOfKinPhone: {
      type: DataTypes.STRING,
      field: "next_of_kin_phone",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "createdAt",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updatedAt",
    },
  },
  {
    sequelize,
    tableName: "Patients",
    timestamps: true,
  }
);

export default Patient;
