import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: console.log
});

const sql = `INSERT INTO "hms_patients" ("id", "first_name", "middle_name", "last_name", "gender", "dob", "patient_status", "phone", "email", "occupation", "heard_about_facility", "patient_number", "sha_number", "county", "sub_county", "area_of_residence", "next_of_kin_first_name", "next_of_kin_last_name", "next_of_kin_phone", "created_at", "updated_at") VALUES
    (1, 'Jael', NULL, 'Mwanake', 'Female', '1998-04-03', 'Alive', '123-456-7890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 07:29:13', '2025-09-05 07:29:13'),
    (2, 'John', NULL, 'Smith', 'Male', '1990-05-15', 'Alive', '123-456-7890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 07:29:13', '2025-09-05 07:29:13'),
    (3, 'LEAH NDEREBA', 'ANGELA', 'KIILU', 'Female', '1980-12-12', 'Alive', '0704191657', 'jimhaowkins@gmail.com', 'CHEF', 'Friend', '1238957', 'SH8912P', 'Bomet', 'Bomet East', NULL, 'SIMON ', 'KENETHS', '+2547896523', '2025-09-10 08:02:41', '2025-09-10 08:02:41'),
    (4, 'JANE', 'ANGELA', 'TRAVIS', 'Female', '2010-12-12', 'Alive', '0703658655', 'doctor@example.com', 'ENGINEER', 'Friend', '24645443', '28471953', 'Nairobi', 'Westlands', NULL, 'PETER ', 'BII', '0701122352', '2025-09-10 12:47:17', '2025-09-10 12:47:17'),
    (5, 'RUTH ', 'A', 'EMY', 'Female', '2012-12-12', 'Alive', '0711111112', 'ruthemy@gmail.com', 'COOKER', 'Friend', '0711121212', '1236', 'Bomet', 'Bomet East', NULL, 'WINNIE', 'SANG', '0701122352', '2025-09-12 14:06:47', '2025-09-12 14:06:47'),
    (7, 'PETER', 'R', 'LISTER', 'Male', '2001-12-12', 'Alive', '0713789652', 'listerp@gmail.com', 'FARMER', 'News Rooms', 'DL06', 'SJH456', 'Bomet', 'Bomet East', NULL, 'LEAH ', 'KENETHS', '0701122352', '2025-09-13 07:01:48', '2025-09-13 07:01:48'),
    (8, 'LEWIS', 'R', 'RONO', 'Male', '2010-01-20', 'Alive', '0700123256', 'lewis@gmail.com', 'Director', 'News Rooms', 'DL07', '1285936', 'Bomet', 'Bomet East', NULL, 'VICTOR', 'AN', '0728896523', '2025-09-17 13:58:27', '2025-09-17 13:58:27'),
    (10, 'JONES', 'KIBET', 'KORIR', 'Male', '2014-12-28', 'Alive', '0710101010', 'joneskibetkorir@gmail.com', 'FARMER', 'Friend', 'DL0009', '125893', 'Bomet', 'Bomet Central', NULL, 'KIBET ', 'BII', '0701010101', '2025-12-24 07:57:08', '2025-12-24 07:57:08')
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();`;

(async () => {
    try {
        console.log("📥 Importing Patients...");
        await sequelize.query(sql);
        console.log("✅ Patients Imported.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Import Failed:", error);
        process.exit(1);
    }
})();
