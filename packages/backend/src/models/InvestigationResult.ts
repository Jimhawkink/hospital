import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import InvestigationRequest from './InvestigationRequest';
import Staff from "./Staff";

class InvestigationResult extends Model {
  public id!: number;
  public request_id!: number;
  public parameter!: string | null;
  public value!: string;
  public unit!: string | null;
  public reference_range!: string | null;
  public flag!: string | null;
  public notes!: string | null;
  public entered_by!: number;
  public date_entered!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvestigationResult.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  request_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  parameter: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reference_range: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  entered_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date_entered: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'investigation_results',
  timestamps: true,
});

InvestigationResult.belongsTo(InvestigationRequest, { foreignKey: 'request_id', onDelete: 'CASCADE' });
InvestigationResult.belongsTo(Staff, { foreignKey: 'entered_by' });

export { InvestigationResult };
export default InvestigationResult;