import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Staff extends Model {
    public staff_id!: string;
    public first_name!: string;
    public last_name!: string;
    public email!: string;
    public phone_number!: string;
    public role!: string;
    public tsc_number!: string | null;
    public departments!: string[];
    public subjects!: string[];
    public status!: string;
    public password_hash!: string;
}

Staff.init(
    {
        staff_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
        },
        phone_number: {
            type: DataTypes.STRING,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tsc_number: {
            type: DataTypes.STRING,
        },
        departments: {
            type: DataTypes.ARRAY(DataTypes.STRING),
        },
        subjects: {
            type: DataTypes.ARRAY(DataTypes.STRING),
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Active',
        },
        password_hash: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize,
        tableName: 'apsims_staff',
        underscored: true,
    }
);

export default Staff;
