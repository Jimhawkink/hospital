import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Income extends Model {
    public id!: number;
    public source!: string; // e.g., Farm Sale, Grant, Donation
    public amount!: number;
    public date!: Date;
    public description!: string;
    public recorded_by!: string; // Staff ID or Name
}

Income.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        recorded_by: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'apsims_income',
    }
);

export default Income;
