import dotenv from "dotenv";
dotenv.config();
import { sequelize } from "./config/db";
import { User } from "./models/index";

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        // Explicitly cast to any to bypass potential strict typing issues if model definition is slightly off
        const users = await (User as any).findAll();
        console.log("Found users:", users.length);
        users.forEach((u: any) => {
            console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
        });

    } catch (error) {
        console.error("Unable to connect to the database or query users:", error);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
