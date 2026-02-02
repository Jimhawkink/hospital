import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

export interface AppointmentTypeAttributes {
    id: number;
    name: string;
    description?: string | null;
    emoji?: string;
    color?: string;
    default_duration_minutes?: number;
    is_active?: boolean;
    sort_order?: number;
    created_at?: Date;
    updated_at?: Date;
}

export type AppointmentTypeCreationAttributes = Optional<
    AppointmentTypeAttributes,
    "id" | "created_at" | "updated_at"
>;

class AppointmentType extends Model<AppointmentTypeAttributes, AppointmentTypeCreationAttributes> implements AppointmentTypeAttributes {
    public id!: number;
    public name!: string;
    public description?: string | null;
    public emoji?: string;
    public color?: string;
    public default_duration_minutes?: number;
    public is_active?: boolean;
    public sort_order?: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

AppointmentType.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        description: { type: DataTypes.STRING(500), allowNull: true },
        emoji: { type: DataTypes.STRING(10), defaultValue: '📅' },
        color: { type: DataTypes.STRING(20), defaultValue: '#3B82F6' },
        default_duration_minutes: { type: DataTypes.INTEGER, defaultValue: 30 },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        modelName: "AppointmentType",
        tableName: "appointment_types",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export { AppointmentType };
export default AppointmentType;
