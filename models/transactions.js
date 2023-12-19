import mongoose from "mongoose";

const transactionsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    amount: mongoose.Schema.Types.Decimal128,
    description: String, 
    happeningDate: {
        type: Date,
        default: Date.now 
    }
});


const Transactions = mongoose.model('Transactions', transactionsSchema)

export default Transactions