import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    verificationCode: {type: String, required: false},
    id: {type: String},
    country:{type:String, default: null},
    state:{type:String, default: null},
    phone:{type:String, default: null},
    telegramId: {type: String, default: null},
    instagramId: {type:String, default: null},
    website: {type:String, default: null},
    theme: {type: Boolean, default: false},
    visibility: {type: Boolean, default: true},
    balance: {type: Number, default: 0},
    points: {type: Number, default: 0},
    avatar: {type: String, default:"avatar_13.jpg"},
    joined: {
        type: Date,
        default: new Date()
    },
    savedTools: {
        type: Array,
        default: []
    }
})

const user = mongoose.model('User', userSchema)

export default user