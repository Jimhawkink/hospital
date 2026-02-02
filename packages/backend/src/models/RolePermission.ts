// src/models/RolePermission.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import UserRole from "./UserRole";
import Permission from "./Permission";

export class RolePermission extends Model {
    public id!: number;
    public role_id!: number;
    public permission_id!: number;
    public can_create!: boolean;
    public can_edit!: boolean;
    public can_view!: boolean;
    public can_archive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associations
    public Permission?: Permission;
    public UserRole?: UserRole;
}

RolePermission.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "user_roles",
                key: "id",
            },
        },
        permission_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "permissions",
                key: "id",
            },
        },
        can_create: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_edit: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_view: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        can_archive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: "role_permissions",
        modelName: "RolePermission",
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ["role_id", "permission_id"],
            },
        ],
    }
);

// Set up associations
RolePermission.belongsTo(UserRole, { foreignKey: "role_id", as: "role" });
RolePermission.belongsTo(Permission, { foreignKey: "permission_id", as: "permission" });

UserRole.hasMany(RolePermission, { foreignKey: "role_id", as: "rolePermissions" });
Permission.hasMany(RolePermission, { foreignKey: "permission_id", as: "permissionRoles" });

export default RolePermission;
