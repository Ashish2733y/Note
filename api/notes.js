const { sql, initDb } = require('./db');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    await initDb();

    try {
        // 1. GET ALL NOTES FOR A USER
        if (req.method === 'GET') {
            const phone = req.query.phone;
            let rows = [];

            if (phone) {
                const result = await sql`
                    SELECT id, phone, title, content, color, is_pinned AS "isPinned", is_selected AS "isSelected", updated_at AS "updatedAt"
                    FROM notes WHERE phone = ${phone} ORDER BY is_pinned DESC, updated_at DESC;
                `;
                rows = result.rows;
            } else {
                const result = await sql`
                    SELECT id, phone, title, content, color, is_pinned AS "isPinned", is_selected AS "isSelected", updated_at AS "updatedAt"
                    FROM notes ORDER BY is_pinned DESC, updated_at DESC;
                `;
                rows = result.rows;
            }

            return res.status(200).json({ success: true, notes: rows });
        }

        // 2. CREATE OR UPSERT A NOTE
        if (req.method === 'POST') {
            const { id, phone, title, content, color, isPinned, isSelected, updatedAt } = req.body;
            if (!id || !phone) {
                return res.status(400).json({ success: false, error: 'Note ID and phone required' });
            }

            const { rows } = await sql`
                INSERT INTO notes (id, phone, title, content, color, is_pinned, is_selected, updated_at)
                VALUES (${id}, ${phone}, ${title || ''}, ${content || ''}, ${color || 'yellow'}, ${isPinned || false}, ${isSelected || false}, ${updatedAt || Date.now()})
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    color = EXCLUDED.color,
                    is_pinned = EXCLUDED.is_pinned,
                    is_selected = EXCLUDED.is_selected,
                    updated_at = EXCLUDED.updated_at
                RETURNING id, title, content, color, is_pinned AS "isPinned", updated_at AS "updatedAt";
            `;

            return res.status(200).json({ success: true, note: rows[0] });
        }

        // 3. BULK SAVE OR SYNC ALL NOTES
        if (req.method === 'PUT') {
            const { phone, notes } = req.body;
            if (!phone || !Array.isArray(notes)) {
                return res.status(400).json({ success: false, error: 'Phone and notes array required' });
            }

            // Sync notes in transaction
            for (const note of notes) {
                await sql`
                    INSERT INTO notes (id, phone, title, content, color, is_pinned, is_selected, updated_at)
                    VALUES (${note.id}, ${phone}, ${note.title || ''}, ${note.content || ''}, ${note.color || 'yellow'}, ${note.isPinned || false}, ${note.isSelected || false}, ${note.updatedAt || Date.now()})
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        content = EXCLUDED.content,
                        color = EXCLUDED.color,
                        is_pinned = EXCLUDED.is_pinned,
                        is_selected = EXCLUDED.is_selected,
                        updated_at = EXCLUDED.updated_at;
                `;
            }

            return res.status(200).json({ success: true, message: 'Notes synced to Vercel Postgres' });
        }

        // 4. DELETE NOTE OR BULK DELETE NOTES
        if (req.method === 'DELETE') {
            const { id, ids, phone } = req.body || req.query;

            if (id) {
                await sql`DELETE FROM notes WHERE id = ${id};`;
                return res.status(200).json({ success: true, message: 'Note deleted' });
            }

            if (ids && Array.isArray(ids)) {
                for (const noteId of ids) {
                    await sql`DELETE FROM notes WHERE id = ${noteId};`;
                }
                return res.status(200).json({ success: true, message: 'Selected notes deleted' });
            }

            if (phone) {
                await sql`DELETE FROM notes WHERE phone = ${phone} AND is_selected = TRUE;`;
                return res.status(200).json({ success: true, message: 'Selected notes deleted' });
            }

            return res.status(400).json({ success: false, error: 'Note ID or IDs required' });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Vercel Postgres Notes Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
