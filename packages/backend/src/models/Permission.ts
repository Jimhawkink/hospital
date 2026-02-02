// src/models/Permission.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

export class Permission extends Model {
    public id!: number;
    public permission_name!: string;
    public permission_key!: string;
    public category!: string | null;
    public description!: string | null;
    public has_create!: boolean;
    public has_edit!: boolean;
    public has_view!: boolean;
    public has_archive!: boolean;
    public sort_order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Permission.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        permission_name: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
        },
        permission_key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        has_create: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        has_edit: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        has_view: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        has_archive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: "permissions",
        modelName: "Permission",
        timestamps: true,
    }
);

export default Permission;
