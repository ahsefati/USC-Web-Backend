import mongoose from "mongoose";

const citySchema = mongoose.Schema({
    name: String,
    country: Number,
    QofLife: Number,
    PPI: Number,
    Safety: Number,
    HCI: Number,
    CLI: Number,
    PPtoIR: Number,
    TCTI: Number,
    PI: Number,
    CI: Number,
    RI: Number
})


const Cities = mongoose.model('Cities', citySchema)

export default Cities