import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/db";
import Invoice from "./Invoice";

export class Payment extends Model<InferAttributes<Payment>, InferCreationAttributes<Payment>> {
    declare id: CreationOptional<number>;
    declare invoice_id: number;
    declare amount: number;
    declare method: "cash" | "card" | "mobile";
    declare transaction_code: string;
}

Payment.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    invoice_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: DataTypes.DECIMAL(10, 2),
    method: DataTypes.ENUM("cash", "card", "mobile"),
    transaction_code: DataTypes.STRING
}, { sequelize, tableName: "payments" });

Payment.belongsTo(Invoice, { foreignKey: "invoice_id" });

export default Payment;
