import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class SubordinateStaff extends Model {
    public staff_id!: string;
    public first_name!: string;
    public last_name!: string;
    public phone_number!: string;
    public role!: string;
    public id_number!: string;
    public date_hired!: Date;
    public status!: string;
}

SubordinateStaff.init(
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
        phone_number: {
            type: DataTypes.STRING,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        id_number: {
            type: DataTypes.STRING,
            unique: true,
        },
        date_hired: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Active',
        },
    },
    {
        sequelize,
        tableName: 'apsims_subordinate_staff',
        underscored: true, // This ensures snake_case columns match the DB
    }
);

export default SubordinateStaff;
