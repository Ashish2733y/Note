const { sql } = require('@vercel/postgres');

/**
 * Ensures Database Tables (users & notes) exist in Vercel Postgres
 */
async function initDb() {
    try {
        // Users Table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                country_code VARCHAR(10) DEFAULT '+91',
                phone VARCHAR(20) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Notes Table
        await sql`
            CREATE TABLE IF NOT EXISTS notes (
                id VARCHAR(100) PRIMARY KEY,
                phone VARCHAR(20) NOT NULL,
                title TEXT,
                content TEXT,
                color VARCHAR(20) DEFAULT 'yellow',
                is_pinned BOOLEAN DEFAULT FALSE,
                is_selected BOOLEAN DEFAULT FALSE,
                updated_at BIGINT NOT NULL
            );
        `;
        return true;
    } catch (error) {
        console.error('Failed to initialize Vercel Postgres database:', error);
        return false;
    }
}

module.exports = { sql, initDb };
