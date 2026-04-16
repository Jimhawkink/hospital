import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ExamType extends Model {
    public id!: number;
    public name!: string; // CAT 1, CAT 2, Exam 1, etc.
    public weight!: number; // e.g., 30 for 30%
    public description!: string;
}

ExamType.init(
    {
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
        weight: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'apsims_exam_types',
    }
);

export default ExamType;
