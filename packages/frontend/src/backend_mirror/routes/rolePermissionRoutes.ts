// routes/rolePermissionRoutes.ts
import express, { Request, Response } from "express";
import Staff from "../models/Staff";
import User from "../models/User";
import Permission from "../models/Permission";
import RolePermission from "../models/RolePermission";
import UserRole from "../models/UserRole";

const router = express.Router();

// =============================================
// GET all user roles
// =============================================
router.get("/roles", async (req: Request, res: Response) => {
    try {
        const roles = await UserRole.findAll({
            where: { is_active: true },
            order: [["role_name", "ASC"]],
        });
        console.log(`✅ Fetched ${roles.length} user roles`);
        res.json(roles);
    } catch (err: any) {
        console.error("❌ Error fetching user roles:", err.message);
        res.status(500).json({ error: "Failed to fetch user roles", details: err.message });
    }
});

// =============================================
// CREATE a new user role
// =============================================
router.post("/roles", async (req: Request, res: Response) => {
    try {
        const { role_name, description, organisation_id } = req.body;

        if (!role_name) {
            return res.status(400).json({ error: "Role name is required" });
        }

        const newRole = await UserRole.create({
            role_name: role_name.trim(),
            description: description?.trim() || null,
            organisation_id: organisation_id || null,
            is_active: true,
        });

        console.log("✅ Created user role:", newRole.toJSON());
        res.status(201).json(newRole);
    } catch (err: any) {
        console.error("❌ Error creating user role:", err.message);
        res.status(500).json({ error: "Failed to create user role", details: err.message });
    }
});

// =============================================
// GET all permissions
// =============================================
router.get("/permissions", async (req: Request, res: Response) => {
    try {
        const permissions = await Permission.findAll({
            order: [["sort_order", "ASC"], ["permission_name", "ASC"]],
        });
        console.log(`✅ Fetched ${permissions.length} permissions`);
        res.json(permissions);
    } catch (err: any) {
        console.error("❌ Error fetching permissions:", err.message);
        res.status(500).json({ error: "Failed to fetch permissions", details: err.message });
    }
});

// =============================================
// GET permissions for a specific role
// =============================================
router.get("/roles/:roleId/permissions", async (req: Request, res: Response) => {
    try {
        const { roleId } = req.params;

        // First, get all permissions
        const allPermissions = await Permission.findAll({
            order: [["sort_order", "ASC"], ["permission_name", "ASC"]],
        });

        // Then get the role's permissions
        const rolePermissions = await RolePermission.findAll({
            where: { role_id: roleId },
        });

        // Create a map for quick lookup
        const permissionMap = new Map<number, RolePermission>();
        rolePermissions.forEach((rp) => {
            permissionMap.set(rp.permission_id, rp);
        });

        // Combine permissions with role-specific settings
        const result = allPermissions.map((perm) => {
            const rolePerm = permissionMap.get(perm.id);
            return {
                id: perm.id,
                permission_name: perm.permission_name,
                permission_key: perm.permission_key,
                category: perm.category,
                has_create: perm.has_create,
                has_edit: perm.has_edit,
                has_view: perm.has_view,
                has_archive: perm.has_archive,
                can_create: rolePerm?.can_create || false,
                can_edit: rolePerm?.can_edit || false,
                can_view: rolePerm?.can_view || false,
                can_archive: rolePerm?.can_archive || false,
            };
        });

        console.log(`✅ Fetched permissions for role ${roleId}`);
        res.json(result);
    } catch (err: any) {
        console.error("❌ Error fetching role permissions:", err.message);
        res.status(500).json({ error: "Failed to fetch role permissions", details: err.message });
    }
});

// =============================================
// SAVE/UPDATE permissions for a specific role
// =============================================
router.post("/roles/:roleId/permissions", async (req: Request, res: Response) => {
    try {
        const { roleId } = req.params;
        const { permissions } = req.body; // Array of { permission_id, can_create, can_edit, can_view, can_archive }

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: "Permissions must be an array" });
        }

        console.log(`📥 Saving ${permissions.length} permissions for role ${roleId}`);

        // Verify role exists
        const role = await UserRole.findByPk(roleId);
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        // Delete existing permissions for this role
        await RolePermission.destroy({ where: { role_id: roleId } });

        // Insert new permissions
        const rolePermissionsToCreate = permissions.map((perm: any) => ({
            role_id: parseInt(roleId),
            permission_id: perm.permission_id,
            can_create: Boolean(perm.can_create),
            can_edit: Boolean(perm.can_edit),
            can_view: Boolean(perm.can_view),
            can_archive: Boolean(perm.can_archive),
        }));

        await RolePermission.bulkCreate(rolePermissionsToCreate, {
            updateOnDuplicate: ["can_create", "can_edit", "can_view", "can_archive", "updatedAt"],
        });

        console.log(`✅ Saved permissions for role ${roleId}`);
        res.json({ message: "Permissions saved successfully", count: permissions.length });
    } catch (err: any) {
        console.error("❌ Error saving role permissions:", err.message);
        res.status(500).json({ error: "Failed to save role permissions", details: err.message });
    }
});

// =============================================
// UPDATE a single permission for a role (toggle)
// =============================================
router.put("/roles/:roleId/permissions/:permissionId", async (req: Request, res: Response) => {
    try {
        const { roleId, permissionId } = req.params;
        const { can_create, can_edit, can_view, can_archive } = req.body;

        // Find or create the role permission
        let [rolePerm, created] = await RolePermission.findOrCreate({
            where: { role_id: roleId, permission_id: permissionId },
            defaults: {
                role_id: parseInt(roleId),
                permission_id: parseInt(permissionId),
                can_create: Boolean(can_create),
                can_edit: Boolean(can_edit),
                can_view: Boolean(can_view),
                can_archive: Boolean(can_archive),
            },
        });

        if (!created) {
            await rolePerm.update({
                can_create: can_create !== undefined ? Boolean(can_create) : rolePerm.can_create,
                can_edit: can_edit !== undefined ? Boolean(can_edit) : rolePerm.can_edit,
                can_view: can_view !== undefined ? Boolean(can_view) : rolePerm.can_view,
                can_archive: can_archive !== undefined ? Boolean(can_archive) : rolePerm.can_archive,
            });
        }

        console.log(`✅ Updated permission ${permissionId} for role ${roleId}`);
        res.json(rolePerm);
    } catch (err: any) {
        console.error("❌ Error updating role permission:", err.message);
        res.status(500).json({ error: "Failed to update role permission", details: err.message });
    }
});

// =============================================
// DELETE a user role
// =============================================
router.delete("/roles/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const role = await UserRole.findByPk(id);
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        // Soft delete by setting is_active to false
        await role.update({ is_active: false });
        console.log(`✅ Deleted role ${id}`);
        res.json({ message: "Role deleted successfully" });
    } catch (err: any) {
        console.error("❌ Error deleting role:", err.message);
        res.status(500).json({ error: "Failed to delete role", details: err.message });
    }
});

export default router;
