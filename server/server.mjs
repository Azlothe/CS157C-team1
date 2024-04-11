import { client } from './database/connection.mjs';
import ENV from './EnvVars.mjs';
import express from 'express';
import cors from 'cors';
import { initDB } from './database/initDB.mjs';
import constants from './database/constants.mjs';

const app = express();
app.use(cors());

initDB();

app.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
});


// temporarily use for example data if needed for other parts of app while database is in progress
app.get('/api/strokes', async (req, res) => {
    try {
        const query = `SELECT * FROM ${constants.KEYSPACE}.Strokes`;
        const result = await client.execute(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing Cassandra query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/strokes', async (req, res) => {
    const { userID, username, coordinates, color, weight } = req.body;

    // Generating a current timestamp for the stroke
    const time = new Date().toISOString();

    try {
        // Assuming strokeID is auto-increment or you have another method of generating unique IDs
        // Also assuming the color is received as an object and needs to be converted into a tuple
        const colorTuple = [color.r, color.g, color.b];

        // Prepare your INSERT query
        const insertQuery = `INSERT INTO ${constants.KEYSPACE}.Strokes (strokeID, userID, username, coordinates, color, weight, time) VALUES (uuid(), ?, ?, ?, ?, ?, ?)`;
        await client.execute(insertQuery, [userID, username, coordinates, colorTuple, weight, time], { prepare: true });
        res.status(201).send('Stroke saved successfully');
    } catch (error) {
        console.error('Error saving stroke data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
