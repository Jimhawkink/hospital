import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import Encounter from './Encounter';
import Staff from "./Staff";

class InvestigationRequest extends Model {
  public id!: number;
  public encounter_id!: number;
  public test_name!: string;
  public department!: string | null; // Null for "Other"
  public type!: 'laboratory' | 'imaging';
  public status!: 'requested' | 'not_collected' | 'collected' | 'results_posted';
  public request_notes!: string | null;
  public requested_by!: number;
  public date_requested!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvestigationRequest.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  encounter_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  test_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('laboratory', 'imaging'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('requested', 'not_collected', 'collected', 'results_posted'),
    defaultValue: 'requested',
  },
  request_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requested_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date_requested: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'investigation_requests',
  timestamps: true,
});

InvestigationRequest.belongsTo(Encounter, { foreignKey: 'encounter_id', onDelete: 'CASCADE' });
InvestigationRequest.belongsTo(Staff, { foreignKey: 'requested_by' });

export { InvestigationRequest };
export default InvestigationRequest;