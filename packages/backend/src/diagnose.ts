import dotenv from "dotenv";
import path from "path";
// Load .env from packages/backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { sequelize } from "./config/db";
import OrganisationSetting from "./models/OrganisationSetting";
import PaymentMethod from "./models/PaymentMethod";

async function diagnose() {
    try {
        console.log("🔍 Diagnosing Organisation Settings...");
        await sequelize.authenticate();
        console.log("✅ Database connected.");

        console.log("🔍 Checking OrganisationSetting table...");
        try {
            const count = await OrganisationSetting.count();
            console.log(`✅ Table exists. Row count: ${count}`);
        } catch (e: any) {
            console.error("❌ Table check failed:", e.message);
        }

        console.log("🔍 Testing findOne with Association...");
        try {
            const settings = await OrganisationSetting.findOne({
                include: [{ model: PaymentMethod, as: "paymentMethod" }]
            });
            console.log("✅ findOne success.");
            if (settings) {
                console.log("DATA:", JSON.stringify(settings.toJSON(), null, 2));
            } else {
                console.log("DATA: null (Table empty)");
            }
        } catch (e: any) {
            console.error("❌ findOne failed:", e);
        }

    } catch (err) {
        console.error("❌ Fatal error:", err);
    } finally {
        await sequelize.close();
    }
}

diagnose();
