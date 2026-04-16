import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class RemedialClass extends Model {
    public id!: number;
    public subject_id!: string;
    public teacher_id!: string;
    public day!: string;
    public time!: string;
    public cost_per_session!: number;
}

RemedialClass.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        subject_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        teacher_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        day: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cost_per_session: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'apsims_remedial_classes',
    }
);

export default RemedialClass;
