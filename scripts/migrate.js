require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL environment variable is missing.');
        console.error('Create a .env file and add: DATABASE_URL=postgres://user:password@localhost:5432/dbname');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL.');

        // Ensure migrations_history table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations_history (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Read migrations folder
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        // Get already run migrations
        const { rows } = await client.query('SELECT filename FROM migrations_history');
        const runFiles = new Set(rows.map(row => row.filename));

        let migrationsRun = 0;

        for (const file of files) {
            if (!runFiles.has(file)) {
                console.log(`Running migration: ${file}...`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                
                try {
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query('INSERT INTO migrations_history (filename) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`Successfully completed migration: ${file}`);
                    migrationsRun++;
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error(`Error running migration ${file}:`, err);
                    throw err;
                }
            }
        }

        if (migrationsRun === 0) {
            console.log('No new migrations to run.');
        } else {
            console.log(`Successfully run ${migrationsRun} migration(s).`);
        }

    } catch (err) {
        console.error('Migration script failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
};

runMigrations();
