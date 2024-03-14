import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const { db, pgp } = require('../pgdb.cjs')


export const getAllSources = async (req, res) => {
    try {
        const query_str = `
            SELECT
            *
            FROM
            sources;
        `
        const sources = await db.any(query_str)
        res.status(200).send(sources)
    } catch (error) {
        console.log(error)
    }
}

export const getPointsInABox = async (req, res) => {
    try {
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
        const points = await db.any(query_str)
        res.status(200).send(points)
    } catch (error) {
        console.log(error)
    }
}


export const getPointsInABoxWithFilters = async (req, res) => {
    try {
        const { min_lat, min_lon, max_lat, max_lon, username, sourceId } = req.body
        
        let usernameSelector;
        if (username!==undefined){
            usernameSelector = `AND u."username" = '${username}'`
        }else{
            usernameSelector = ``
        }

        let sourceSelector;
        if (sourceId!==undefined){
            sourceSelector = `AND u."sourceId" = '${sourceId}'`
        }else{
            sourceSelector = ``
        }

        const query_str = `
            SELECT
            p.pointid,
            u."username",
            ST_X(p.geom::geometry) AS longitude,
            ST_Y(p.geom::geometry) AS latitude,
            to_timestamp(p.timestamp) AT TIME ZONE 'UTC' AS datetime,
            u."sourceId",
            p.metadata
            FROM
                points p
            JOIN
                users u ON p.userId = u."userId"
            JOIN
                sources s ON u."sourceId" = s."sourceId"
            WHERE
                ST_Within(p.geom, ST_MakeEnvelope(${min_lat}, ${min_lon}, ${max_lat}, ${max_lon}, 4326))
                ${sourceSelector}
                ${usernameSelector}
            ;
        `
        const points = await db.any(query_str)

        res.status(200).send(points)
    } catch (error) {
        console.log(error)
    }
}