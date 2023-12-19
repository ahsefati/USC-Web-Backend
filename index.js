import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from 'cors';
import dotenv from 'dotenv'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'
import toolRoutes from './routes/tools.js'
import Coins from "./models/coins.js";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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


const updateCoinsDB = () => {
        const sdk = require('api')('@coinstatsopenapi/v1.0#8fc3kgx93i1locyjj6r');
        sdk.auth('YcvhJI87P+Q3tB2kz/QpOM1rgp38azdun8RRdh/P7lY=');
        sdk.coinController_coinList({limit: '8'})
        .then(({ data }) => {
                data.result.forEach(coin => {
                const updateData = {
                        price: coin.price,
                        priceChange1h: coin.priceChange1h,
                        priceChange1d: coin.priceChange1d,
                        priceChange1w: coin.priceChange1w,
                        volume: coin.volume,
                        marketCap: coin.marketCap,
                        supply: coin.availableSupply,
                        lastupdated: new Date() // Current date and time
                };

                // Save to MongoDB
                Coins.findOneAndUpdate(
                        { id: coin.id }, // Search criterion
                        updateData, // Data to update
                        { upsert: true, new: true }, // Options: upsert and return new document
                        (err, doc) => {
                                if (err) {
                                        console.error('Error updating coin in database:', err);
                                }
                        }
                );
                });
        })
        .catch(err => console.error(err));
}

setInterval(updateCoinsDB, 1000);
    