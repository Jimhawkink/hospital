import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Student extends Model {
    public id!: number;
    public admission_number!: string;
    public first_name!: string;
    public last_name!: string;
    public class_level!: string;
    public stream!: string;
    // ... add other fields as needed
}

Student.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        admission_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        class_level: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Form 1',
        },
        stream: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Active'
        }
    },
    {
        sequelize,
        tableName: 'apsims_students',
    }
);

export default Student;
