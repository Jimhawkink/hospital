
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { sequelize } from "../src/config/db";
import User from "../src/models/User";

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const createJim = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Main DB Connected");

        // Fix sequence out of sync issue
        try {
            await sequelize.query("SELECT setval('hms_users_id_seq', (SELECT MAX(id) FROM hms_users));");
            console.log("✅ Sequence synced.");
        } catch (err) {
            console.warn("⚠️ Could not sync sequence (might not be needed or different sequence name). Continuing...");
        }

        const email = "jimhawkins@gmail.com";
        const password = "@jiM43"; // raw password
        const name = "Jim Hawkins";
        const role = "admin";

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: {
                name,
                email,
                password: hashedPassword,
                role,
            } as any,
        });

        if (created) {
            console.log(`✅ User ${email} created successfully with role ${role}.`);
        } else {
            console.log(`⚠️ User ${email} already exists.`);
            // Optional: Update password if exists?
            user.password = hashedPassword;
            await user.save();
            console.log(`🔄 Password updated for ${email}.`);
        }

    } catch (error) {
        console.error("❌ Error creating user:", error);
    } finally {
        await sequelize.close();
    }
};

createJim();
