import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class PocketMoneyAccount extends Model {
    public id!: number;
    public student_id!: number;
    public balance!: number;
    public status!: string; // Active, Suspended
}

PocketMoneyAccount.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        balance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Active',
        },
    },
    {
        sequelize,
        tableName: 'apsims_pocket_money_accounts',
    }
);

export default PocketMoneyAccount;
