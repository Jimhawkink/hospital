import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class FeePayment extends Model {
    public id!: number;
    public student_id!: number;
    public amount!: number;
    public date!: Date;
    public term!: string;
    public year!: number;
    public method!: string; // Cash, Bank, M-Pesa
    public reference!: string; // Receipt No / Transaction ID
}

FeePayment.init(
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
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY, // Just date is enough usually
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        term: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        method: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reference: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'apsims_fee_payments',
    }
);

export default FeePayment;
