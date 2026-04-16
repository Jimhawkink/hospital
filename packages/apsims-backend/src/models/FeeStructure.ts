import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class FeeStructure extends Model {
    public id!: number;
    public term!: string;
    public year!: number;
    public class_level!: string; // Form 1, Form 2, etc.
    public amount!: number;
    public description!: string;
}

FeeStructure.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        term: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        class_level: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'apsims_fee_structures',
    }
);

export default FeeStructure;
