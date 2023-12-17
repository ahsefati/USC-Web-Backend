import mongoose from "mongoose";

const fieldSchema = mongoose.Schema({
    NF: String,
    DT: String,
    ASF: Number,
    Jobs: [],
})

const Fields = mongoose.model('Fields', fieldSchema)

export default Fields