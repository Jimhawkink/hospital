import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TimetableSlot extends Model {
    public id!: number;
    public day!: string; // Monday, Tuesday
    public start_time!: string; // 08:00
    public end_time!: string; // 08:40
    public class_level!: string; // Form 1 East
    public subject!: string; // Math
    public teacher!: string; // Mr. Kamau
    public type!: string; // Lesson, Break, Lunch
}

TimetableSlot.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        day: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        end_time: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        class_level: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        teacher: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Lesson',
        },
    },
    {
        sequelize,
        tableName: 'apsims_timetable_slots',
    }
);

export default TimetableSlot;
