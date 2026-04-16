import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import POSSaleItem from "./POSSaleItem";
import Patient from "./Patient";

class POSSale extends Model {
    public id!: number;
    public receipt_no!: string;
    public patient_id?: number;
    public subtotal!: number;
    public tax_total!: number;
    public discount_total!: number;
    public total_amount!: number;
    public amount_tendered!: number;
    public change_due!: number;
    public payment_method!: string; // Cash, Paybill, etc.
    public status!: string; // Completed, Pending
    public notes?: string;
    public created_at!: Date;
    public updated_at!: Date;
}

POSSale.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        receipt_no: { type: DataTypes.STRING, unique: true, allowNull: false },
        patient_id: { type: DataTypes.INTEGER, allowNull: true },
        subtotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        tax_total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        discount_total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        amount_tendered: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        change_due: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        payment_method: { type: DataTypes.STRING, defaultValue: 'Cash' },
        status: { type: DataTypes.STRING, defaultValue: 'Completed' },
        notes: DataTypes.TEXT,
    },
    {
        sequelize,
        modelName: "POSSale",
        tableName: "hms_pos_sales",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

// Associations are defined in server.ts to avoid circular dependency issues
// POSSale.hasMany(POSSaleItem, { foreignKey: "sale_id", as: "items" });
// POSSale.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

export default POSSale;

