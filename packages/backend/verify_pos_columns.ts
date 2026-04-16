
import { sequelize } from './src/config/db';
import { QueryTypes } from 'sequelize';

async function checkAndFixColumns() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        const tableName = 'hms_pos_sales';
        const columnsToCheck = ['amount_tendered', 'change_due'];

        for (const col of columnsToCheck) {
            const [results] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND column_name = '${col}';
      `);

            if (results.length === 0) {
                console.log(`Column '${col}' missing in '${tableName}'. Adding it...`);
                await sequelize.query(`
          ALTER TABLE ${tableName} 
          ADD COLUMN ${col} DECIMAL(10, 2) DEFAULT 0;
        `);
                console.log(`Column '${col}' added successfully.`);
            } else {
                console.log(`Column '${col}' already exists in '${tableName}'.`);
            }
        }

        console.log('Verification complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
}

checkAndFixColumns();
