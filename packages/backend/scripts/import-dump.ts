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
    logging: false
});

const sqlStatements = [
    // Staff/Users first (Providers)
    // Converted to snake_case because underscored: true is set on Staff model.
    `INSERT INTO "hms_staff" ("id", "title", "first_name", "last_name", "gender", "email", "phone", "address", "role", "job_title", "username", "password", "added_on", "active_status", "created_at", "updated_at") VALUES
    (1, 'Dr.', 'Joshua', 'Korir', 'Male', 'joshua@gmail.com', '+254710129856', 'Bomet East', 'Cashier', 'Medical Officer', 'Josh', '$2a$10$y4QIRhGd8IZ2CoCH9Mdw9.y3ySf7WYngffMytxrE6KNYVyxaEw5Qy', '2025-09-10 09:27:42', true, '2025-09-10 09:27:42', '2025-12-01 15:28:18'),
    (2, 'Dr.', 'Jimhawkins1', 'Korir1', 'Male', 'jimhaowkins@gmail.com', '+254720316175', '', 'Nurse', 'Nurse', 'KENETH', '$2a$10$odWZCnJD5c7iennIStHuFeDtnMVEwvNkOutgdu94k7oHUU9ciYAWG', '2025-11-29 10:52:59', true, '2025-11-29 10:52:59', '2025-11-29 10:52:59'),
    (4, 'Dr.', 'MICAH', 'Koech', 'Male', 'perischepkirui20@gmail.com', '+254720316179', '', 'Nurse', 'Nurse', 'MICAH', '$2a$10$VW8dJoStqYHQEwFjYqEMdOvYzBwHS3JO3c7vjeK.J7rrCtptRUCru', '2025-11-29 11:08:54', true, '2025-11-29 11:08:54', '2025-11-29 11:08:54'),
    (7, 'Dr.', 'MCKENZY ', 'JONES', 'Male', 'terrencebeaker@gmail.com', '+254119087458', '120 SILIBWET', 'Doctor', 'Medical Officer', 'MCKENZY', '$2a$10$gOK1qakaKKZxjqQC/m2yG.96wrd8AT2xX1/yGHExiA.gYRoSkz1Py', '2025-12-23 17:19:34', true, '2025-12-23 17:19:34', '2025-12-23 17:19:34')
    ON CONFLICT (id) DO NOTHING;`,

    // Users (User.ts maps timestamps to created_at)
    `INSERT INTO "hms_users" ("id", "name", "email", "password", "role", "created_at", "updated_at") VALUES
    (2, 'Dr. John Doe', 'doctor@hospital.test', '$2a$10$0roMwB6B1mRfkWNy2i4JeuMl1AlmORUY3FzGgTIrLLiu4bSOwzy8u', 'doctor', '2025-09-04 09:03:04', '2025-09-04 09:03:04'),
    (3, 'Nurse Mary Jane', 'nurse@hospital.test', '$2a$10$0roMwB6B1mRfkWNy2i4JeuMl1AlmORUY3FzGgTIrLLiu4bSOwzy8u', 'nurse', '2025-09-04 09:03:05', '2025-09-04 09:03:05'),
    (7, 'MICAH Koech', 'perischepkirui20@gmail.com', '$2a$10$VW8dJoStqYHQEwFjYqEMdOvYzBwHS3JO3c7vjeK.J7rrCtptRUCru', 'Nurse', '2025-11-29 11:08:54', '2025-11-29 11:08:54'),
    (8, 'MCKENZY  JONES', 'terrencebeaker@gmail.com', '$2a$10$gOK1qakaKKZxjqQC/m2yG.96wrd8AT2xX1/yGHExiA.gYRoSkz1Py', 'Doctor', '2025-12-23 17:19:34', '2025-12-23 17:19:34')
    ON CONFLICT (id) DO NOTHING;`,

    // Patients
    `INSERT INTO "hms_patients" ("id", "first_name", "middle_name", "last_name", "gender", "dob", "patient_status", "phone", "email", "occupation", "heard_about_facility", "patient_number", "sha_number", "county", "sub_county", "area_of_residence", "next_of_kin_first_name", "next_of_kin_last_name", "next_of_kin_phone", "created_at", "updated_at") VALUES
    (1, 'Jael', NULL, 'Mwanake', 'Female', '1998-04-03', 'Alive', '123-456-7890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 07:29:13', '2025-09-05 07:29:13'),
    (2, 'John', NULL, 'Smith', 'Male', '1990-05-15', 'Alive', '123-456-7890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-05 07:29:13', '2025-09-05 07:29:13'),
    (3, 'LEAH NDEREBA', 'ANGELA', 'KIILU', 'Female', '1980-12-12', 'Alive', '0704191657', 'jimhaowkins@gmail.com', 'CHEF', 'Friend', '1238957', 'SH8912P', 'Bomet', 'Bomet East', NULL, 'SIMON ', 'KENETHS', '+2547896523', '2025-09-10 08:02:41', '2025-09-10 08:02:41'),
    (4, 'JANE', 'ANGELA', 'TRAVIS', 'Female', '2010-12-12', 'Alive', '0703658655', 'doctor@example.com', 'ENGINEER', 'Friend', '24645443', '28471953', 'Nairobi', 'Westlands', NULL, 'PETER ', 'BII', '0701122352', '2025-09-10 12:47:17', '2025-09-10 12:47:17'),
    (5, 'RUTH ', 'A', 'EMY', 'Female', '2012-12-12', 'Alive', '0711111112', 'ruthemy@gmail.com', 'COOKER', 'Friend', '0711121212', '1236', 'Bomet', 'Bomet East', NULL, 'WINNIE', 'SANG', '0701122352', '2025-09-12 14:06:47', '2025-09-12 14:06:47'),
    (7, 'PETER', 'R', 'LISTER', 'Male', '2001-12-12', 'Alive', '0713789652', 'listerp@gmail.com', 'FARMER', 'News Rooms', 'DL06', 'SJH456', 'Bomet', 'Bomet East', NULL, 'LEAH ', 'KENETHS', '0701122352', '2025-09-13 07:01:48', '2025-09-13 07:01:48'),
    (8, 'LEWIS', 'R', 'RONO', 'Male', '2010-01-20', 'Alive', '0700123256', 'lewis@gmail.com', 'Director', 'News Rooms', 'DL07', '1285936', 'Bomet', 'Bomet East', NULL, 'VICTOR', 'AN', '0728896523', '2025-09-17 13:58:27', '2025-09-17 13:58:27'),
    (10, 'JONES', 'KIBET', 'KORIR', 'Male', '2014-12-28', 'Alive', '0710101010', 'joneskibetkorir@gmail.com', 'FARMER', 'Friend', 'DL0009', '125893', 'Bomet', 'Bomet Central', NULL, 'KIBET ', 'BII', '0701010101', '2025-12-24 07:57:08', '2025-12-24 07:57:08')
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();`,

    // Encounters
    `INSERT INTO "hms_encounters" ("id", "encounter_number", "encounter_type", "priority_type", "notes", "patient_id", "provider_id", "created_at", "updated_at") VALUES
    (1, 'ENC-1757496483769-729', 'Delivery', 'High', '', 1, 1, '2025-09-10 06:28:03', '2025-09-10 10:22:43'),
    (2, 'ENC-1757500310394-931', 'Consultation', 'Normal', '', 1, 1, '2025-09-10 10:31:50', '2025-09-10 10:31:50'),
    (4, 'ENC-1758117538074-242', 'Check-up', 'Normal', '', 8, 1, '2025-09-17 13:58:58', '2025-09-17 13:58:58'),
    (6, 'ENC-1764417420069-696', 'Treatment', 'High', '', 8, 1, '2025-11-29 11:57:00', '2025-11-29 11:57:00'),
    (7, 'ENC-1766563091052-562', 'Treatment', 'Can wait', '', 10, 4, '2025-12-24 07:58:11', '2025-12-24 07:58:11'),
    (8, 'ENC-1766565525411-417', 'Surgery', 'Normal', '', 11, 7, '2025-12-24 08:38:45', '2025-12-24 08:38:45')
    ON CONFLICT (id) DO NOTHING;`
];

(async () => {
    try {
        console.log("📥 Importing User Data...");
        for (const sql of sqlStatements) {
            await sequelize.query(sql);
        }
        console.log("✅ Data Imported successfully.");
        // Sync sequences
        try { await sequelize.query(`SELECT setval('hms_patients_id_seq', (SELECT MAX(id) FROM hms_patients));`); } catch (e) { }
        try { await sequelize.query(`SELECT setval('hms_encounters_id_seq', (SELECT MAX(id) FROM hms_encounters));`); } catch (e) { }
        try { await sequelize.query(`SELECT setval('hms_users_id_seq', (SELECT MAX(id) FROM hms_users));`); } catch (e) { }
        try { await sequelize.query(`SELECT setval('hms_staff_id_seq', (SELECT MAX(id) FROM hms_staff));`); } catch (e) { }

        console.log("✅ Sequences updated.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Import Failed:", error);
        process.exit(1);
    }
})();
