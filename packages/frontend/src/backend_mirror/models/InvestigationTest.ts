import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class InvestigationTest extends Model {
  public id!: number;
  public name!: string;
  public department!: string;
  public type!: 'laboratory' | 'imaging';
  public parameters!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvestigationTest.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('laboratory', 'imaging'),
    allowNull: false,
  },
  parameters: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'hms_investigation_tests',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export { InvestigationTest };
export default InvestigationTest;