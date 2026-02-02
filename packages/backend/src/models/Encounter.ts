import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";
import Patient from "./Patient";
import Staff from "./Staff";

interface EncounterAttributes {
  id: number;
  encounter_number: string;
  encounter_type: string;
  priority_type: string;
  notes?: string;
  patient_id: number;
  provider_id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type EncounterCreationAttributes = Optional<EncounterAttributes, "id" | "notes" | "createdAt" | "updatedAt">;

export class Encounter extends Model<EncounterAttributes, EncounterCreationAttributes> implements EncounterAttributes {
  public id!: number;
  public encounter_number!: string;
  public encounter_type!: string;
  public priority_type!: string;
  public notes?: string;
  public patient_id!: number;
  public provider_id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Encounter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    encounter_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    encounter_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    priority_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    provider_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'staff',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: "encounters",
    modelName: "Encounter",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['encounter_number']
      },
      {
        fields: ['patient_id']
      },
      {
        fields: ['provider_id']
      }
    ]
  }
);

// Associations
Encounter.belongsTo(Patient, {
  foreignKey: "patient_id",
  as: "patient",
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

Encounter.belongsTo(Staff, {
  foreignKey: "provider_id",
  as: "provider",
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

Patient.hasMany(Encounter, {
  foreignKey: "patient_id",
  as: "encounters",
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

Staff.hasMany(Encounter, {
  foreignKey: "provider_id",
  as: "encounters",
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
});

export default Encounter;