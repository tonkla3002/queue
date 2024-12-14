const pool = require('../pool');

async function authenticateApiKey(req, res, next) {
    const apiKey = req.header('x-api-key');
    if (!apiKey) return res.status(401).json({ error: 'API key missing' });

    try {
        const result = await pool.query(
            'SELECT * FROM identity WHERE api_key = $1',
            [apiKey]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired API key' });
        }

        req.apiKeyOwner = result.rows[0].owner; // Add metadata to request object
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = authenticateApiKey;