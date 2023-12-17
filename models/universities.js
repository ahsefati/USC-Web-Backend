import mongoose from "mongoose";

const universitySchema = mongoose.Schema({
    rank: Number,
    name: String,
    country: String,
    location: {
        cid: Number,
        cname: String
    },
    overal: Number,
    ISR: Number,
    IFR: Number,
    FSR: Number,
    CPF: Number,
    AR: Number,
    ER: Number,
    AppFee: Number,
})


const Universities = mongoose.model('Universities', universitySchema)

export default Universities