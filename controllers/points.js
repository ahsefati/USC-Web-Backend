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

export const getAllUsers = async (req, res) => {
    try {
        const query_str = `
            SELECT 
                users.*, 
                sources.name
            FROM users
            JOIN sources ON users."sourceId" = sources."sourceId"
            ORDER BY users."userId";
        `
        const users = await db.any(query_str)
        res.status(200).send(users)
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
        const drop_query = `
            DROP MATERIALIZED VIEW IF EXISTS ahs2;
        `
        await db.any(drop_query)
        
        const { min_lat, min_lon, max_lat, max_lon, username, sourceId, start_time, end_time, max_point_speed, min_point_speed, polygon_geo, state_polygon } = req.body
        
        // Defining the box selector query
        let minLat = -90
        let minLon = -180
        let maxLat = 90
        let maxLon = 180
        if (min_lat!==undefined){
            minLat = min_lat
        }
        if (min_lon!==undefined){
            minLon = min_lon
        }
        if (max_lat!==undefined){
            maxLat = max_lat
        }
        if (max_lon!==undefined){
            maxLon = max_lon
        }
        let boxSelector = `ST_Within(p.geom, ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326))`

        // Define the time range selector
        let startTime = 0
        let endTime = new Date().getTime()
        if (start_time!==undefined){
            startTime = start_time
        }
        if (end_time!==undefined){
            endTime = end_time
        }
        let timerangeSelector = `AND p.timestamp >= ${startTime} AND p.timestamp <= ${endTime}`
        
        // Define username selector
        let usernameSelector = ``
        if (username!==undefined){
            usernameSelector = `AND u."username" = '${username}'`
        }

        // Define source selector
        let sourceSelector = ''
        if (sourceId!==undefined){
            sourceSelector = `And u."sourceId" = '${sourceId}'`
        }

        // Define Polygon selector
        let polygonSelector = ''
        if (state_polygon!==undefined && state_polygon!==-1){
            polygonSelector = `AND ST_Intersects(p.geom, ST_GeomFromGeoJSON('${JSON.stringify(state_polygon)}'))`
        }else if (polygon_geo!==undefined){
            polygonSelector = `AND ST_Intersects(p.geom, ST_GeomFromGeoJSON('${JSON.stringify(polygon_geo)}'))`
        }

        // Define Speed Limit selector
        let min_speed = 0
        let max_speed = 10**10
        if (min_point_speed!==undefined ){
            min_speed = min_point_speed
        }
        if (max_point_speed!==undefined){
            max_speed = max_point_speed
        }
        let speedLimitSelector = `AND p.speed >= ${min_speed} AND p.speed <= ${max_speed}`
        if (min_point_speed===undefined && max_point_speed===undefined){
            speedLimitSelector = ''
        }

        const query_str_directFilters = `
        CREATE MATERIALIZED VIEW ahs2 AS
            SELECT
            p.pointid,
            u."username",
            ST_X(p.geom::geometry) AS longitude,
            ST_Y(p.geom::geometry) AS latitude,
            to_timestamp(p.timestamp) AT TIME ZONE 'UTC' AS datetime,
            u."sourceId",
            p.metadata,
            p.speed
            FROM
                points p
            JOIN
                users u ON p.userId = u."userId"
            JOIN
                sources s ON u."sourceId" = s."sourceId"
            WHERE
                ${boxSelector}
                ${sourceSelector}
                ${timerangeSelector}
                ${usernameSelector}
                ${polygonSelector}
                ${speedLimitSelector}
            ;
        `
        await db.any(query_str_directFilters)

        const query_str_points = `
        Select * FROM ahs2;
        `
        const points = await db.any(query_str_points)

        const query_str_user_stats = `
        SELECT
            "username",
            COUNT(*) AS pointsCount,
            MIN(datetime) AS minTime,
            MAX(datetime) AS maxTime,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latitude) AS medianLatitude,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY longitude) AS medianLongitude
        FROM
            ahs2
        GROUP BY
            "username";
        `
        const user_stats = await db.any(query_str_user_stats)

        const query_str_general_stats = `
        SELECT
            MIN(latitude) AS minLatitude,
            MAX(latitude) AS maxLatitude,
            MIN(longitude) AS minLongitude,
            MAX(longitude) AS maxLongitude
        FROM
            ahs2;
        `

        const general_stats = await db.any(query_str_general_stats)

        res.status(200).send({points: points, user_stats: user_stats, general_stats: general_stats[0]})
    } catch (error) {
        console.log(error)
    }
}



export const getPointsInATimeRangeWithFilter = async (req, res) => {
    try {
        const { start_time, end_time, username } = req.body
        let usernameSelector;
        if (username!==undefined){
            usernameSelector = `AND u."username" = '${username}'`
        }else{
            usernameSelector = ``
        }

        const query_str = `
            SELECT
            p.pointid,
            u."username",
            ST_X(p.geom::geometry) AS longitude,
            ST_Y(p.geom::geometry) AS latitude,
            to_timestamp(p.timestamp) AT TIME ZONE 'UTC' AS datetime,
            p.metadata,
            u."sourceId"
            FROM
                points p
            JOIN
                users u ON p.userId = u."userId"
            WHERE
                p.timestamp >= ${start_time} AND p.timestamp <= ${end_time}
                ${usernameSelector}
            `
        const points = await db.any(query_str)

        res.status(200).send(points)
    } catch (error) {
        console.log(error)
    }
}


export const getHistogramInfo = async (req, res) => {
    try {
        const { mode, precision, limit, sourceId, username } = req.body
        // Define username selector
        let usernameSelector = ``
        if (username!==undefined){
            usernameSelector = `AND u."username" = '${username}'`
        }

        // Define source selector
        let sourceSelector = ``
        if (sourceId!==undefined){
            sourceSelector = `AND u."sourceId" = '${sourceId}'`
        }

        let query_str;
        if (mode=='time'){
            query_str = `
                WITH point_timediffs AS (
                    SELECT 
                        userId,
                        timestamp,
                        -- Adjust time difference to 1 minute batches
                        FLOOR((LEAD(timestamp) OVER (PARTITION BY userId ORDER BY timestamp) - timestamp) / ${parseInt(precision)}) * ${parseInt(precision)} AS time_diff_interval
                    FROM points
                    JOIN users u ON points.userId = u."userId"
                    JOIN sources s ON u."sourceId" = s."sourceId"
                    WHERE 1=1 
                    ${sourceSelector} 
                    ${usernameSelector}
                )
                SELECT
                    time_diff_interval AS histo_value,
                    COUNT(*) AS point_count
                FROM 
                    point_timediffs
                GROUP BY 
                    time_diff_interval
                ORDER BY 
                    COUNT(*) DESC;
            `
        }else {
            query_str = `
                WITH point_distances AS (
                    SELECT 
                        pointId,
                        userId,
                        -- Haversine formula to calculate distance in meters
                        6371000 * acos(
                            LEAST(1, GREATEST(-1,
                                cos(radians(ST_Y(geom))) * cos(radians(ST_Y(LEAD(geom) OVER (PARTITION BY userId ORDER BY timestamp)))) * 
                                cos(radians(ST_X(LEAD(geom) OVER (PARTITION BY userId ORDER BY timestamp))) - radians(ST_X(geom))) + 
                                sin(radians(ST_Y(geom))) * sin(radians(ST_Y(LEAD(geom) OVER (PARTITION BY userId ORDER BY timestamp))))
                            ))
                        ) AS distance
                    FROM points
                    JOIN users u ON points.userId = u."userId"
                    JOIN sources s ON u."sourceId" = s."sourceId"
                    WHERE 1=1
                    ${sourceSelector} 
                    ${usernameSelector}
                )
                SELECT
                    FLOOR(distance / ${parseInt(precision)}) * ${parseInt(precision)} AS histo_value,
                    COUNT(*) AS point_count
                FROM 
                    point_distances
                GROUP BY 
                    histo_value
                ORDER BY 
                    COUNT(*) DESC;
            `
        }

        const info = await db.any(query_str)
        res.status(200).send(info)
    } catch (error) {
        console.log(error)
    }
}