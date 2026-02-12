// src/models/UserRole.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class UserRole extends Model {
    public id!: number;
    public role_name!: string;
    public description!: string | null;
    public is_active!: boolean;
    public organisation_id!: number | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

UserRole.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        role_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        organisation_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: "hms_user_roles",
        modelName: "UserRole",
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

export default UserRole;
