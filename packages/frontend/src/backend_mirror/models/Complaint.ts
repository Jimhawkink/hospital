import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/db';

interface ComplaintAttributes {
  id: number;
  encounter_id: number;
  complaint_text: string;
  duration_value?: number | null;
  duration_unit?: 'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years' | null;
  comments?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'duration_value' | 'duration_unit' | 'comments' | 'created_at' | 'updated_at'> { }

class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
  public id!: number;
  public encounter_id!: number;
  public complaint_text!: string;
  public duration_value!: number | null;
  public duration_unit!: 'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years' | null;
  public comments!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Complaint.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    encounter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hms_encounters',
        key: 'id',
      },
    },
    complaint_text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    duration_value: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration_unit: {
      type: DataTypes.ENUM('Hours', 'Days', 'Weeks', 'Months', 'Years'),
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'hms_complaints',
    sequelize,
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export { Complaint };
export default Complaint;