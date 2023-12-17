import mongoose from "mongoose";

const jobSchema = mongoose.Schema({
    nj: String,
    avgS: Number,
    minS: Number,
    maxS: Number,
    Fields: [],
})

const Jobs = mongoose.model('Jobs', jobSchema)

export default Jobs