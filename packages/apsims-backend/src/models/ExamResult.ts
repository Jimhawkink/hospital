import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ExamResult extends Model {
    public id!: number;
    public student_id!: number;
    public exam_type_id!: number; // Link to ExamType
    public subject_id!: string; // e.g. "MATH", "ENG" - simpler for now than relation
    public score!: number;
    public grade!: string;
    public points!: number;
    public term!: string;
    public year!: number;
}

ExamResult.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        exam_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        subject_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        grade: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        term: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'apsims_exam_results',
    }
);

export default ExamResult;
