
import { sequelize } from '../config/db';

async function fixSequences() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        const tables = [
            { name: 'hms_patients', seq: 'hms_patients_id_seq' },
            // Add other tables if needed
        ];

        for (const table of tables) {
            console.log(`🔄 Fixing sequence for ${table.name}...`);

            // Get max ID
            const [result] = await sequelize.query(`SELECT MAX(id) as max_id FROM "${table.name}"`);
            const maxId = (result[0] as any).max_id || 0;

            // Reset sequence
            // setval(sequence_name, next_value, is_called)
            // next_value should be maxId + 1
            // is_called false means next value will be exactly that. 
            // safe way: setval to maxId

            const nextVal = parseInt(maxId) + 1;
            console.log(`   Detailed: Max ID is ${maxId}, setting sequence to ${nextVal}`);

            await sequelize.query(`SELECT setval('${table.seq}', ${nextVal}, false)`);
            console.log(`✅ Sequence ${table.seq} reset to ${nextVal}`);
        }

        console.log('🎉 All sequences fixed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing sequences:', error);
        process.exit(1);
    }
}

fixSequences();
