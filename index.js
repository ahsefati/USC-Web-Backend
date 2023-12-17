import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from 'cors';
import dotenv from 'dotenv'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import toolRoutes from './routes/tools.js'

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

const CONNECTION_URL = process.env.CONNECTION_URL
const PORT = process.env.PORT || 5000;

mongoose.set('strictQuery', false)
mongoose.connect( CONNECTION_URL, {useNewUrlParser: true, useUnifiedTopology: true})
        .then(()=> app.listen(PORT, () => console.log("Server is running.")))
        .catch((err) => console.log(err.message))

    