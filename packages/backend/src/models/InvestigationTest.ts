import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

class InvestigationTest extends Model {
  public id!: number;
  public name!: string;
  public department!: string;
  public type!: 'laboratory' | 'imaging';
  public parameters!: string | null; // JSON string of array [{parameter: string, unit: string, range: string}]
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InvestigationTest.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // This ensures test names are unique
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
    type: DataTypes.TEXT, // JSON.stringify([{parameter: 'Hb', unit: 'g/dL', range: '12-18'}, ...])
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'investigation_tests',
  timestamps: true,
});

export { InvestigationTest };