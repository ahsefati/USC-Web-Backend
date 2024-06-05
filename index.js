import express, { query } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from 'cors';
import dotenv from 'dotenv'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import toolRoutes from './routes/tools.js'
import pointsRoutes from './routes/points.js'
// Upload imports
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { calculateSpeedAndAddToPoints, calculateSpeedAndAddToSource, calculateSpeedAndAddToUsers, createPointsCSV, createUsersCSV, insertInitToSources, uploadNewPointsToDB, uploadNewUsersToDB } from "./utils/afterUploads.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config()
const app = express();
app.use(bodyParser.json({limit:"30mb", extended: true}))
app.use(bodyParser.urlencoded({limit:"30mb", extended:true}))
app.use(cors())

// Upload Dataset
const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(__dirname, 'uploads');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
});
      
const upload = multer({ 
        storage: storage,
        limits: { fileSize: 512 * 1024 * 1024 }, // Limit to 512 MB
        fileFilter: (req, file, cb) => {
          if (file.mimetype === 'text/csv') {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
          }
        }
});

app.get('/', (req, res) => {
        res.send('APP is running!!')
})

app.use('/posts', postRoutes)
app.use('/users', userRoutes)
app.use('/tools', toolRoutes)
app.use('/points', pointsRoutes)

app.post('/upload', upload.single('file'), async (req, res) => {
        const { userName, datasetName, referenceLink } = req.body;        
        
        if (!req.file) {
                return res.status(400).send('No file uploaded.');
        }
        
        const result = await insertInitToSources(datasetName, userName, referenceLink)
        const sourceId = result[0].sourceId
        const sourceName = result[0].name
        const uploadedFileName = req.file.filename;

        // Save the metadata and handle the file as needed
        res.send('File uploaded successfully');
        
        // Right now, sources table has been created and we have its id
        // Now it's time to create the user's table using the file that has been uploaded and the sourceId/sourceName
        const {rows, nextUserId} = await createUsersCSV(sourceName, sourceId, uploadedFileName, __dirname)
        const {createPointsCSVRes, nextPointId} = await createPointsCSV(rows, sourceName, uploadedFileName, __dirname)
        // Now, we processed all the CSV files, it's time to upload them to the database
        console.log("START UPLOADING USERS...")
        const updatedUserDBRes = await uploadNewUsersToDB(uploadedFileName, __dirname)
        if (updatedUserDBRes===0){
                console.log("FINISHED UPLOADING USERS...")
                console.log("START UPLOADING POINTS...")
                const updatedPointsDBRes = await uploadNewPointsToDB(uploadedFileName, __dirname)
                if (updatedPointsDBRes===0) {
                        console.log("FINISHED UPLOADING POINTS...")
                        console.log("START Calculating SPEED of POINTS")
                        const speedPointsRes = await calculateSpeedAndAddToPoints(nextUserId)
                        if (speedPointsRes===0) {
                                console.log("FINISHED Calculating SPEED of POINTS")
                                console.log("START Calculating SPEED of USERS")
                                const speedUsersRes = await calculateSpeedAndAddToUsers(nextUserId)
                                if (speedUsersRes===0){
                                        console.log("FINISHED Calculating SPEED of USERS")
                                        console.log("START Calculating SPEED of SOURCE")
                                        const speedSourceRes = await calculateSpeedAndAddToSource(nextUserId)
                                        if (speedSourceRes===0){
                                                console.log("FINISHED Calculating SPEED of SOURCE")
                                        }
                                }
                        }
                }
        }
});

const CONNECTION_URL = process.env.CONNECTION_URL
const PORT = process.env.PORT || 5000;

mongoose.set('strictQuery', false)
mongoose.connect( CONNECTION_URL, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(()=> app.listen(PORT, () => console.log("Server is running.")))
        .catch((err) => console.log(err.message))
    