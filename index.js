import express, { query } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from 'cors';
import dotenv from 'dotenv'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import toolRoutes from './routes/tools.js'
import pointsRoutes from './routes/points.js'

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { db, pgp } = require('./pgdb.cjs');

dotenv.config()
const app = express();
app.use(bodyParser.json({limit:"30mb", extended: true}))
app.use(bodyParser.urlencoded({limit:"30mb", extended:true}))
app.use(cors())


app.get('/', (req, res) => {
        res.send('APP is running!!')
})

app.use('/posts', postRoutes)
app.use('/users', userRoutes)
app.use('/tools', toolRoutes)
app.use('/points', pointsRoutes)

app.get('/api/points', async (req, res) => {
        try {
                // const query_str = "SELECT * FROM points WHERE ST_Within(geom, ST_MakeEnvelope(39.984, 116.318, 39.9847, 116.319, 4326))"
                const query_str = `
                SELECT
pointid,
userid,
ST_X(geom::geometry) AS longitude,
ST_Y(geom::geometry) AS latitude,
timestamp
FROM
points
WHERE
ST_Within(geom, ST_MakeEnvelope(37.75, -122.39, 37.752, -122.392, 4326));  
                `
                const points = await db.any(query_str);
                console.log("I have it now!")
                res.json(points);
        } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
}});

const CONNECTION_URL = process.env.CONNECTION_URL
const PORT = process.env.PORT || 5000;

mongoose.set('strictQuery', false)
mongoose.connect( CONNECTION_URL, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(()=> app.listen(PORT, () => console.log("Server is running.")))
        .catch((err) => console.log(err.message))
    