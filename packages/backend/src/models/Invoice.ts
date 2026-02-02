import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/db";
import Patient from "./Patient";

export class Invoice extends Model<InferAttributes<Invoice>, InferCreationAttributes<Invoice>> {
    declare id: CreationOptional<number>;
    declare patient_id: number;
    declare invoice_number: string;
    declare amount: number;
    declare status: "unpaid" | "partially_paid" | "paid" | "cancelled";
}

Invoice.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    invoice_number: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
    status: { type: DataTypes.ENUM("unpaid", "partially_paid", "paid", "cancelled"), defaultValue: "unpaid" }
}, { sequelize, tableName: "invoices" });

Invoice.belongsTo(Patient, { foreignKey: "patient_id" });

export default Invoice;
