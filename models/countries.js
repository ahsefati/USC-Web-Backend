import mongoose from "mongoose";

const countrySchema = mongoose.Schema({
    name: String,
    cid: Number,
    QofLife: Number,
    PPI: Number,
    Safety: Number,
    HCI: Number,
    CLI: Number,
    PPtoIR: Number,
    TCTI: Number,
    PI: Number,
    CI: Number,
    RI: Number,
    Valid: Number,
    PR: Number,
    TFB: Number,
    TFG: Number,
    FA: Number,
    VISA: Number,
})


const Countries = mongoose.model('Countries', countrySchema)

export default Countries