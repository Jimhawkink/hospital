import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import POSSale from "./POSSale";

class POSSaleItem extends Model {
    public id!: number;
    public sale_id!: number;
    public product_id!: string;
    public product_name!: string;
    public quantity!: number;
    public unit_price!: number;
    public tax_rate!: number; // Percentage (e.g., 16.00)
    public tax_amount!: number;
    public discount_amount!: number;
    public subtotal!: number;
}

POSSaleItem.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        sale_id: { type: DataTypes.INTEGER, allowNull: false },
        product_id: { type: DataTypes.STRING, allowNull: false },
        product_name: { type: DataTypes.STRING, allowNull: false },
        quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
        unit_price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        tax_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
        tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        subtotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    },
    {
        sequelize,
        modelName: "POSSaleItem",
        tableName: "hms_pos_sale_items",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default POSSaleItem;
