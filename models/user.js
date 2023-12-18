import mongoose from "mongoose";


const walletItemSchema = new mongoose.Schema({
    id: String,
    balance: {
      type: mongoose.Types.Decimal128,
      default: 0.0
    }
});

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
    },
    cashBalance: {type: mongoose.Types.Decimal128, default: 0.0},
    wallet: {
        type: [walletItemSchema],
        default: [
            {
                id:'bitcoin',
                balance: 0.0
            },
            {
                id:'ethereum',
                balance: 0.0
            },
            {
                id:'tether',
                balance: 0.0
            },
            {
                id:'binance-coin',
                balance: 0.0
            },
            {
                id:'ripple',
                balance: 0.0
            },
            {
                id:'solana',
                balance: 0.0
            },
            {
                id:'usd-coin',
                balance: 0.0
            },
            {
                id:'cardano',
                balance: 0.0
            },
        ]
    }

})

const user = mongoose.model('User', userSchema)

export default user