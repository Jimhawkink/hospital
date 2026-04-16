import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class GradingSystem extends Model {
    public id!: number;
    public grade!: string; // A, A-, B+
    public min_score!: number; // 80
    public max_score!: number; // 100
    public points!: number; // 12, 11, 10 (for calculations)
    public remarks!: string; // Excellent, Good
}

GradingSystem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        grade: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        min_score: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        max_score: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        points: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        remarks: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'apsims_grading_system',
    }
);

export default GradingSystem;
