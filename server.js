const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        databaseMode: db.useLocalFallback ? 'local-json' : 'postgres',
        timestamp: new Date()
    });
});

// GET /api/sync - Retrieve state
app.get('/api/sync', async (req, res) => {
    try {
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
                return res.json(JSON.parse(raw));
            }
            return res.json({});
        } else {
            const queryResult = await db.query('SELECT data FROM tenant_state WHERE tenant_id = $1', ['default']);
            if (queryResult.rows.length > 0) {
                return res.json(queryResult.rows[0].data);
            }
            return res.json({});
        }
    } catch (err) {
        console.error('Error in GET /api/sync:', err);
        res.status(500).json({ error: 'Failed to retrieve database state.' });
    }
});

// POST /api/sync - Persist state
app.post('/api/sync', async (req, res) => {
    try {
        const state = req.body;
        if (db.useLocalFallback) {
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(state, null, 2));
            return res.json({ success: true });
        } else {
            await db.query(`
                INSERT INTO tenant_state (tenant_id, data, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id)
                DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
            `, ['default', JSON.stringify(state)]);
            return res.json({ success: true });
        }
    } catch (err) {
        console.error('Error in POST /api/sync:', err);
        res.status(500).json({ error: 'Failed to persist database state.' });
    }
});

// Serve Static Frontend Assets
app.use(express.static(__dirname));

// Serve index.html for all other routes (Single Page Application routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server and Init Database
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    if (!db.useLocalFallback) {
        try {
            // Ensure tenant_state table exists
            console.log('Ensuring tenant_state table exists...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS tenant_state (
                    tenant_id VARCHAR(50) PRIMARY KEY,
                    data JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Run migrations and seed
            await db.runMigrations();
            await db.seedDatabase();
        } catch (err) {
            console.error('Database initialization failed:', err);
        }
    }
});
