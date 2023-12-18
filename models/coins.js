import mongoose from "mongoose";

const coinSchema = mongoose.Schema({
    id: String,
    price: Number,
    priceChange1h: Number,
    priceChange1d: Number,
    priceChange1w: Number,
    volume: Number,
    supply: Number,
    marketCap: Number,
    lastupdated: Date
})


const Coins = mongoose.model('Coins', coinSchema)

export default Coins