const { sql, initDb } = require('./db');

module.exports = async function handler(req, res) {
    // Enable CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    await initDb();

    const action = req.query.action || (req.body && req.body.action);

    try {
        if (action === 'register') {
            const { countryCode, phone, password } = req.body;
            if (!phone || !password) {
                return res.status(400).json({ success: false, error: 'Phone and password are required' });
            }

            // Insert into Vercel Postgres users table
            const { rows } = await sql`
                INSERT INTO users (country_code, phone, password)
                VALUES (${countryCode || '+91'}, ${phone}, ${password})
                ON CONFLICT (phone) 
                DO UPDATE SET password = ${password}, country_code = ${countryCode || '+91'}
                RETURNING phone, country_code;
            `;

            return res.status(200).json({ success: true, user: rows[0] });
        }

        if (action === 'login') {
            const { phone, password } = req.body;
            if (!phone) {
                // If checking default first user
                const { rows } = await sql`SELECT country_code, phone, password FROM users LIMIT 1;`;
                if (rows.length === 0) {
                    return res.status(404).json({ success: false, message: 'No user registered' });
                }
                return res.status(200).json({ success: true, user: { phone: rows[0].phone, countryCode: rows[0].country_code } });
            }

            const { rows } = await sql`
                SELECT country_code, phone, password FROM users WHERE phone = ${phone};
            `;

            if (rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            if (rows[0].password === password) {
                return res.status(200).json({ success: true, user: { phone: rows[0].phone, countryCode: rows[0].country_code } });
            } else {
                return res.status(401).json({ success: false, error: 'Incorrect password' });
            }
        }

        if (action === 'change-password' || action === 'reset-password') {
            const { phone, newPassword } = req.body;
            if (!phone || !newPassword) {
                return res.status(400).json({ success: false, error: 'Phone and new password required' });
            }

            await sql`
                UPDATE users SET password = ${newPassword} WHERE phone = ${phone};
            `;

            return res.status(200).json({ success: true, message: 'Password updated successfully' });
        }

        return res.status(400).json({ success: false, error: 'Invalid action parameter' });
    } catch (error) {
        console.error('Vercel Postgres Auth Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
