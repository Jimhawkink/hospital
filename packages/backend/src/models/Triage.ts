import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

// Define the attributes interface
export interface TriageAttributes {
  id: number;
  patient_id: number;
  patient_status?: string;
  temperature?: number;
  heart_rate?: number;
  blood_pressure?: string;
  respiratory_rate?: number;
  blood_oxygenation?: number;
  weight?: number;
  height?: number;
  muac?: number;
  lmp_date?: Date;
  comments?: string;
  date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional attributes for creation
interface TriageCreationAttributes extends Optional<TriageAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Define the Triage model class
export class Triage extends Model<TriageAttributes, TriageCreationAttributes> implements TriageAttributes {
  public id!: number;
  public patient_id!: number;
  public patient_status?: string;
  public temperature?: number;
  public heart_rate?: number;
  public blood_pressure?: string;
  public respiratory_rate?: number;
  public blood_oxygenation?: number;
  public weight?: number;
  public height?: number;
  public muac?: number;
  public lmp_date?: Date;
  public comments?: string;
  public date?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Triage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Patient ID is required"
        },
        isInt: {
          msg: "Patient ID must be a valid integer"
        }
      }
    },
    patient_status: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: "Patient status must be 255 characters or less"
        }
      }
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [30.0],
          msg: "Temperature must be at least 30°C"
        },
        max: {
          args: [45.0],
          msg: "Temperature must be at most 45°C"
        }
      }
    },
    heart_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [30],
          msg: "Heart rate must be at least 30 BPM"
        },
        max: {
          args: [250],
          msg: "Heart rate must be at most 250 BPM"
        }
      }
    },
    blood_pressure: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: "Blood pressure must be 50 characters or less"
        },
        is: {
          args: [/^\d{2,3}\/\d{2,3}$|^$/],
          msg: "Blood pressure must be in format like '120/80'"
        }
      }
    },
    respiratory_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [5],
          msg: "Respiratory rate must be at least 5 breaths per minute"
        },
        max: {
          args: [60],
          msg: "Respiratory rate must be at most 60 breaths per minute"
        }
      }
    },
    blood_oxygenation: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [0.0],
          msg: "Blood oxygenation must be at least 0%"
        },
        max: {
          args: [100.0],
          msg: "Blood oxygenation must be at most 100%"
        }
      }
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [0.5],
          msg: "Weight must be at least 0.5 kg"
        },
        max: {
          args: [500.0],
          msg: "Weight must be at most 500 kg"
        }
      }
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [30.0],
          msg: "Height must be at least 30 cm"
        },
        max: {
          args: [250.0],
          msg: "Height must be at most 250 cm"
        }
      }
    },
    muac: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [5.0],
          msg: "MUAC must be at least 5 cm"
        },
        max: {
          args: [50.0],
          msg: "MUAC must be at most 50 cm"
        }
      }
    },
    lmp_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: "LMP date must be a valid date",
          args: true
        }
      }
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: "Comments must be 2000 characters or less"
        }
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: {
          msg: "Date must be a valid datetime",
          args: true
        }
      }
    }
  },
  {
    sequelize,
    modelName: "Triage",
    tableName: "triages",
    timestamps: true,
    indexes: [
      {
        fields: ['patient_id']
      },
      {
        fields: ['date']
      },
      {
        fields: ['patient_id', 'date']
      }
    ],
    hooks: {
      beforeValidate: (triage: Triage) => {
        if (!triage.date) {
          triage.date = new Date();
        }
        if (triage.patient_status) {
          triage.patient_status = triage.patient_status.trim();
        }
        if (triage.blood_pressure) {
          triage.blood_pressure = triage.blood_pressure.trim();
        }
        if (triage.comments) {
          triage.comments = triage.comments.trim();
        }
        if (triage.lmp_date) {
          const currentDate = new Date();
          currentDate.setHours(currentDate.getHours() + 3); // Adjust to EAT (UTC+3)
          const lmpDate = new Date(triage.lmp_date);
          if (lmpDate > new Date(currentDate.toISOString().split('T')[0])) {
            throw new Error("LMP date cannot be in the future");
          }
        }
      }
    }
  }
);

export default Triage;