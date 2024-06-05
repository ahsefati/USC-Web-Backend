import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { trimObjectKeys } from './utils.js';

const require = createRequire(import.meta.url)
const { db, pgp } = require('../pgdb.cjs')



const getNextSourceId = async () => {
    try {
        const query_str = `
            SELECT
            MAX("sourceId") AS maxId
            FROM
            sources;
        `
        const result = await db.any(query_str)
        return result[0].maxid + 1 || 1;
    } catch (error) {
        console.log(error)
    }
}

const getNextUserId = async () => {
    try {
        const query_str = `
            SELECT
            MAX("userId") AS maxId
            FROM
            users;
        `
        const result = await db.any(query_str)
        return result[0].maxid + 1 || 1;
    } catch (error) {
        console.log(error)
    }
}

const getNextPointId = async () => {
    try {
        const query_str = `
            SELECT
            MAX(pointId) AS maxId
            FROM
            points;
        `
        const result = await db.any(query_str)
        return result[0].maxid + 1 || 1;
    } catch (error) {
        console.log(error)
    }
}

export const insertInitToSources = async (datasetName, userName, link) => {
    try {
        const nextSourceId = await getNextSourceId();
        const query = 'INSERT INTO "sources" ("sourceId", "name", "link") VALUES ($1, $2, $3) RETURNING *';
        const values = [nextSourceId, `${datasetName}_${userName}`, link];
        const result = await db.query(query, values);    
        return result
    }catch (error){
        console.log(error)
        return error
    }
}

export const createUsersCSV = async (sourceName, sourceId, uploadedFileName, __dirname) => {
    return new Promise(async (resolve, reject) => {
        const uploadedFilePath = path.join(__dirname, 'uploads', uploadedFileName);
        const uniqueUsers = new Map();
        let rows = [];
        let nextUserId = await getNextUserId();
        let initialNextUserId = nextUserId
        fs.createReadStream(uploadedFilePath)
        .pipe(csv())
        .on('data', (data) => {
            data = trimObjectKeys(data)
            const uniqueUserKey = `${sourceName}_${data.username}`;
            if (!uniqueUsers.has(uniqueUserKey)) {
            uniqueUsers.set(uniqueUserKey, {
                userId: nextUserId++,
                sourceId: sourceId,
                username: uniqueUserKey,
            });
            }
        })
        .on('end', async () => {
            // Push distinct users into rows
            uniqueUsers.forEach(user => rows.push(user));

            const outputFilePath = path.join(__dirname, 'uploads', `processed_users_${uploadedFileName}`);
            const csvWriter = createObjectCsvWriter({
            path: outputFilePath,
            header: [
                { id: 'userId', title: 'userId' },
                { id: 'sourceId', title: 'sourceId' },
                { id: 'username', title: 'username' },
            ],
            });

            try {
                await csvWriter.writeRecords(rows);
                resolve({rows, nextUserId: initialNextUserId});
            } catch (error) {
                reject(error);
            }
        });

    })
}


export const createPointsCSV = async (rows, sourceName, uploadedFileName, __dirname) => {
    return new Promise(async (resolve, reject) => {
        // To update points CSV based on the new information:
        // Create a map of constructed username to userId
        let nextPointId = await getNextPointId();
        const uploadedFilePath = path.join(__dirname, 'uploads', uploadedFileName);

        const usernameToUserId = new Map();
        rows.forEach(row => {
            usernameToUserId.set(row.username, row.userId);
        });

        const processedFilePath = path.join(__dirname, 'uploads', `processed_points_${uploadedFileName}`);
        const processedCsvWriter = createObjectCsvWriter({
            path: processedFilePath,
            header: [
                { id: 'pointId', title: 'pointId' },
                { id: 'userId', title: 'userId' },
                { id: 'geom', title: 'geom' },
                { id: 'timestamp', title: 'timestamp' },
                { id: 'metadata', title: 'metadata' },
            ],
        });

        const processedRows = [];

        fs.createReadStream(uploadedFilePath)
        .pipe(csv())
        .on('data', (data) => {
            data = trimObjectKeys(data)
            const uniqueUserKey = `${sourceName}_${data.username}`;
            if (usernameToUserId.has(uniqueUserKey)) {
            processedRows.push({
                pointId: nextPointId++,
                userId: usernameToUserId.get(uniqueUserKey),
                geom: data.geom,
                timestamp: data.timestamp,
                metadata: data.metadata,
            });
            }
        })
        .on('end', async () => {
            try {
                await processedCsvWriter.writeRecords(processedRows);
                resolve({createPointsCSVRes:0, nextPointId});
            } catch (error) {
                reject(error);
            }
        });
    })
}


export const uploadNewUsersToDB = async (uploadedFileName, __dirname) => {
    try {
        const uploadedFilePath = path.join(__dirname, 'uploads', `processed_users_${uploadedFileName}`);
        
        const query_str = `
            COPY users("userId", "sourceId", username)
            FROM '${uploadedFilePath}' DELIMITER ',' CSV HEADER;
        `
        await db.any(query_str)
        return 0
    } catch (error) {
        console.log(error)
        return -1
    }
}

export const uploadNewPointsToDB = async (uploadedFileName, __dirname) => {
    try {
        const uploadedFilePath = path.join(__dirname, 'uploads', `processed_points_${uploadedFileName}`);
        
        const query_str = `
            COPY points(pointId, userId, geom, "timestamp", "metadata")
            FROM '${uploadedFilePath}' DELIMITER ',' CSV HEADER;
        `
        await db.any(query_str)
        return 0
    } catch (error) {
        console.log(error)
        return -1
    }
}

// Now everythin is ready to calculate the speed of the points 
export const calculateSpeedAndAddToPoints = async (userIdToStart) => {
    try {
        const query_str = `
            WITH point_data AS (
                SELECT 
                    pointId,
                    userId,
                    geom,
                    timestamp,
                    LAG(geom) OVER (PARTITION BY userId ORDER BY timestamp) AS prev_geom,
                    LAG(timestamp) OVER (PARTITION BY userId ORDER BY timestamp) AS prev_timestamp
                FROM points
                WHERE userId >= ${userIdToStart}
            )
            UPDATE points
            SET speed = 
                CASE 
                    WHEN prev_timestamp IS NOT NULL THEN
                        CASE 
                            WHEN points.timestamp = point_data.prev_timestamp THEN
                                NULL  -- Handle division by zero when timestamps are equal
                            ELSE
                                6371000 * ACOS(
                                    LEAST(1, GREATEST(-1,
                                        COS(RADIANS(ST_Y(points.geom))) * COS(RADIANS(ST_Y(point_data.prev_geom))) * 
                                        COS(RADIANS(ST_X(point_data.prev_geom)) - RADIANS(ST_X(points.geom)))) + 
                                        SIN(RADIANS(ST_Y(points.geom))) * SIN(RADIANS(ST_Y(point_data.prev_geom)))
                                    ))
                                / ((points.timestamp - point_data.prev_timestamp))  -- Time difference in seconds 
                        END
                    ELSE
                        NULL  -- For the first point of each user, speed cannot be calculated
                END
            FROM point_data
            WHERE points.pointId = point_data.pointId;
        `

        await db.any(query_str)
        return 0

    } catch (error) {
        console.log(error)
        return -1
    }
}


// Now everythin is ready to calculate the percentile speeds for each user 
export const calculateSpeedAndAddToUsers = async (userIdToStart) => {
    try {
        const query_str = `
            WITH point_speeds AS (
                SELECT 
                    userId,
                    CASE 
                        WHEN SUM(CASE WHEN time_diff > 0 THEN 1 ELSE 0 END) > 0
                        THEN PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0)
                        ELSE 0
                    END AS speed_90th_percentile_mps,
                    CASE 
                        WHEN SUM(CASE WHEN time_diff > 0 THEN 1 ELSE 0 END) > 0
                        THEN PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0)
                        ELSE 0
                    END AS speed_95th_percentile_mps,
                    CASE 
                        WHEN SUM(CASE WHEN time_diff > 0 THEN 1 ELSE 0 END) > 0
                        THEN PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0)
                        ELSE 0
                    END AS speed_99th_percentile_mps,
                    CASE 
                        WHEN SUM(CASE WHEN time_diff > 0 THEN 1 ELSE 0 END) > 0
                        THEN PERCENTILE_CONT(0.995) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0)
                        ELSE 0
                    END AS speed_99_5th_percentile_mps,
                    CASE 
                        WHEN SUM(CASE WHEN time_diff > 0 THEN 1 ELSE 0 END) > 0
                        THEN PERCENTILE_CONT(0.999) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0)
                        ELSE 0
                    END AS speed_99_9th_percentile_mps
                FROM (
                    SELECT 
                        userId,
                        pointId,
                        timestamp,
                        geom,
                        -- Haversine formula to calculate distance in meters
                        6371000 * ACOS(
                            LEAST(1, GREATEST(-1,
                                COS(RADIANS(ST_Y(geom))) * COS(RADIANS(ST_Y(LEAD(geom) OVER (PARTITION BY userId ORDER BY timestamp)))) * 
                                COS(RADIANS(ST_X(LEAD(geom) OVER (PARTITION BY userId ORDER BY timestamp))) - RADIANS(ST_X(geom))) + 
                                SIN(RADIANS(ST_Y(geom))) * SIN(RADIANS(ST_Y(LEAD(geom) OVER (PARTITION BY userId ORDER BY timestamp))))
                            ))
                        ) AS distance,
                        (LEAD(timestamp) OVER (PARTITION BY userId ORDER BY timestamp) - timestamp) AS time_diff
                    FROM points
                    WHERE userId >= ${userIdToStart}
                ) AS subquery
                GROUP BY userId
            )
            UPDATE users
            SET
                speed_90th_percentile_mps = point_speeds.speed_90th_percentile_mps,
                speed_95th_percentile_mps = point_speeds.speed_95th_percentile_mps,
                speed_99th_percentile_mps = point_speeds.speed_99th_percentile_mps,
                speed_99_5th_percentile_mps = point_speeds.speed_99_5th_percentile_mps,
                speed_99_9th_percentile_mps = point_speeds.speed_99_9th_percentile_mps
            FROM
                point_speeds
            WHERE
                users."userId" = point_speeds.userId;
        `
        await db.any(query_str)
        return 0

    } catch (error) {
        console.log(error)
        return -1
    }
}


// Now everythin is ready to calculate the percentile speeds for the newly added source 
export const calculateSpeedAndAddToSource = async (userIdToStart) => {
    try {
        const query_str = `
            WITH point_speeds AS (
                SELECT 
                    u."sourceId" AS idOfSource,
                    p.pointId,
                    p.timestamp,
                    p.geom,
                    -- Haversine formula to calculate distance in meters
                    6371000 * ACOS(
                        LEAST(1, GREATEST(-1,
                            COS(RADIANS(ST_Y(p.geom))) * COS(RADIANS(ST_Y(LEAD(p.geom) OVER (PARTITION BY u."userId", u."sourceId" ORDER BY p.timestamp)))) * 
                            COS(RADIANS(ST_X(LEAD(p.geom) OVER (PARTITION BY u."userId", u."sourceId" ORDER BY p.timestamp))) - RADIANS(ST_X(p.geom))) + 
                            SIN(RADIANS(ST_Y(p.geom))) * SIN(RADIANS(ST_Y(LEAD(p.geom) OVER (PARTITION BY u."userId", u."sourceId" ORDER BY p.timestamp))))
                        ))
                    ) AS distance,
                    (LEAD(p.timestamp) OVER (PARTITION BY u."userId", u."sourceId" ORDER BY p.timestamp) - p.timestamp) AS time_diff
                FROM points p
                INNER JOIN users u ON p.userId = u."userId" AND p.userId >= ${userIdToStart}
            )
            UPDATE sources
            SET
                speed_90th_percentile_mps = CASE WHEN point_speeds.speed_90th_percentile_mps > 0 THEN point_speeds.speed_90th_percentile_mps ELSE sources.speed_90th_percentile_mps END,
                speed_95th_percentile_mps = CASE WHEN point_speeds.speed_95th_percentile_mps > 0 THEN point_speeds.speed_95th_percentile_mps ELSE sources.speed_95th_percentile_mps END,
                speed_99th_percentile_mps = CASE WHEN point_speeds.speed_99th_percentile_mps > 0 THEN point_speeds.speed_99th_percentile_mps ELSE sources.speed_99th_percentile_mps END,
                speed_99_5th_percentile_mps = CASE WHEN point_speeds.speed_99_5th_percentile_mps > 0 THEN point_speeds.speed_99_5th_percentile_mps ELSE sources.speed_99_5th_percentile_mps END,
                speed_99_9th_percentile_mps = CASE WHEN point_speeds.speed_99_9th_percentile_mps > 0 THEN point_speeds.speed_99_9th_percentile_mps ELSE sources.speed_99_9th_percentile_mps END
            FROM (
                SELECT
                    idOfSource,
                    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0) AS speed_90th_percentile_mps,
                    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0) AS speed_95th_percentile_mps,
                    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0) AS speed_99th_percentile_mps,
                    PERCENTILE_CONT(0.995) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0) AS speed_99_5th_percentile_mps,
                    PERCENTILE_CONT(0.999) WITHIN GROUP (ORDER BY distance / time_diff) FILTER (WHERE time_diff > 0) AS speed_99_9th_percentile_mps
                FROM
                    point_speeds
                GROUP BY
                    idOfSource
            ) AS point_speeds
            WHERE
                sources."sourceId" = point_speeds.idOfSource;
        `
        await db.any(query_str)
        return 0

    } catch (error) {
        console.log(error)
        return -1
    }
}