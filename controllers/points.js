import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { db, pgp } = require('../pgdb.cjs');


export const getPointsInABox = async (req, res) => {
    try {
        console.log(req)
        const { min_lat, min_lon, max_lat, max_lon } = req.body
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
            ST_Within(geom, ST_MakeEnvelope(${min_lat}, ${min_lon}, ${max_lat}, ${max_lon}, 4326));
        `
        const points = await db.any(query_str);

        res.status(200).send(points)
    } catch (error) {
        console.log(error)
    }
}