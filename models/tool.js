import mongoose from "mongoose";

const toolSchema = mongoose.Schema({
    title: String,
    descriptiom: String,
    icon: String,
    color: String,
    poweredBy: String,
    tags: [String],
    likes:{
        type: [String],
        default: []
    },
    numberOfLikes: {
        type: Number,
        default: 0
    },
    comments: {
        type: [String],
        default: []
    },
    numberOfComments: {
        type: Number,
        default: 0
    }
})


const Tool = mongoose.model('Tool', toolSchema)

export default Tool