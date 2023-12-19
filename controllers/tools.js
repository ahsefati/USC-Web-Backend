import mongoose from "mongoose";
import jwt from 'jsonwebtoken'

import Tool from "../models/tool.js"
import Universities from "../models/universities.js";
import Countries from "../models/countries.js";
import Cities from "../models/cities.js";
import Costs from "../models/costs.js";
import Jobs from "../models/jobs.js";
import Fields from "../models/fields.js";
import Coins from "../models/coins.js";
import User from "../models/user.js"
import Transactions from "../models/transactions.js"

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export const getTransactions = async (req, res) => {
    try{
        if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' })

        const transactions = await Transactions.find({userId: req.userId})
        if (transactions){
            res.status(200).json({transactions: transactions})
        } else{
            res.status(200).json({transactions: []})
        }
    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const buyCoin = async (req, res) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' })
    
    const { valueToHandleCoin, idToHandleCoin } = req.body
    const withdrawalAmount = parseFloat(valueToHandleCoin);

    // Optional: Check for valid number
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user has enough balance
        if (currentUser.cashBalance < withdrawalAmount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Doing the job:
        const update = { $inc: { cashBalance: -withdrawalAmount } }
        const selectedCoin = await Coins.findOne({id:idToHandleCoin})
        console.log(selectedCoin.price) 
        update.$inc[`wallet.$.balance`] = parseFloat(withdrawalAmount/selectedCoin.price)

        const updatedUser = await User.findOneAndUpdate(
            { 
                _id: req.userId, 
                "wallet.id": idToHandleCoin // Filter to match the specific coin in the wallet
            },
            update,
            { 
                new: true,
                arrayFilters: [{ "elem.id": idToHandleCoin }] // Array filter for the specific coin
            }
        );
    
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or coin ID not found in wallet" });
        }

        // Create a new transaction record
        const newTransaction = new Transactions({
            userId: req.userId,
            amount: withdrawalAmount,
            description: 'Buy a coin: ' + selectedCoin.id , // You can customize this description
            happeningDate: new Date() // Or set default in the schema
        })

        // Save the transaction
        await newTransaction.save();

        // Update user's info
        const newUserInfo = await User.findById(req.userId)
        const token = jwt.sign({email: newUserInfo.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

        res.status(200).json({result: newUserInfo, token: token})

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const sellCoin = async (req, res) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' })
    
    const { valueToHandleCoin, idToHandleCoin } = req.body
    const withdrawalAmount = parseFloat(valueToHandleCoin);

    // Optional: Check for valid number
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user has enough balance
        if (currentUser.wallet.filter(coin=>coin.id===idToHandleCoin)[0].balance < withdrawalAmount) {
            return res.status(400).json({ message: "Insufficient balance!" });
        }

        const selectedCoin = await Coins.findOne({id: idToHandleCoin})
        const depositAmount = withdrawalAmount * selectedCoin.price

        // Doing the job:
        const update = { $inc: { cashBalance: depositAmount } } 
        update.$inc[`wallet.$.balance`] = -1 * parseFloat(withdrawalAmount)

        const updatedUser = await User.findOneAndUpdate(
            { 
                _id: req.userId, 
                "wallet.id": idToHandleCoin // Filter to match the specific coin in the wallet
            },
            update,
            { 
                new: true,
                arrayFilters: [{ "elem.id": idToHandleCoin }] // Array filter for the specific coin
            }
        );
    
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or coin ID not found in wallet" });
        }

        // Create a new transaction record
        const newTransaction = new Transactions({
            userId: req.userId,
            amount: withdrawalAmount,
            description: 'Sell a coin: ' + selectedCoin.id , 
            happeningDate: new Date()
        })

        // Save the transaction
        await newTransaction.save();

        // Update user's info
        const newUserInfo = await User.findById(req.userId)
        const token = jwt.sign({email: newUserInfo.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

        res.status(200).json({result: newUserInfo, token: token})

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const addCash = async (req, res) => {
    if (!req.userId) return res.status(401).json({message: 'Unauthenticated!'})
    const { valueToDeposit } = req.body

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $inc: { cashBalance: valueToDeposit } }, // Use $inc to increment the balance
            { new: true } // Returns the updated document
        )

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found!" })
        }

        // Create a new transaction record
        const newTransaction = new Transactions({
            userId: req.userId,
            amount: valueToDeposit,
            description: 'Deposit Money.', // You can customize this description
            happeningDate: new Date() // Or set default in the schema
        })

        // Save the transaction
        await newTransaction.save();

        // update user's info
        const newUserInfo = await User.findById(req.userId)
        const token = jwt.sign({email: newUserInfo.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

        res.status(200).json({result: newUserInfo, token: token})

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong!" })
    }
}

export const withdrawCash = async (req, res) => {
    if (!req.userId) return res.status(401).json({ message: 'Unauthenticated' })
    
    const { valueToWithdraw } = req.body
    const withdrawalAmount = parseFloat(valueToWithdraw);

    // Optional: Check for valid number
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user has enough balance
        if (currentUser.cashBalance < withdrawalAmount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $inc: { cashBalance: -withdrawalAmount } },
            { new: true }
        );

        // Create a new transaction record
        const newTransaction = new Transactions({
            userId: req.userId,
            amount: withdrawalAmount,
            description: 'Withdraw Money.', // You can customize this description
            happeningDate: new Date() // Or set default in the schema
        })

        // Save the transaction
        await newTransaction.save();

        // Update user's info
        const newUserInfo = await User.findById(req.userId)
        const token = jwt.sign({email: newUserInfo.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

        res.status(200).json({result: newUserInfo, token: token})

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const getLiveCoinsData = async (req, res) => {
    try {
        Coins.find({}, (err, coins) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).json(coins);
            }
        });
    } catch (error) {
        console.log(error)
    }
}

export const getLiveCoinData = async (req, res) => {
    try {
        const {id, period} = req.body
        console.log(id)
        console.log(period)
        const sdk = require('api')('@coinstatsopenapi/v1.0#8fc3kgx93i1locyjj6r');

        sdk.auth('YcvhJI87P+Q3tB2kz/QpOM1rgp38azdun8RRdh/P7lY=');
        sdk.coinController_coinChart({period: period, coinId: id})
        .then(({ data }) => {
            res.status(200).json(data);
        })
        .catch(err => console.error(err));

    } catch (error) {
        console.log(error)
    }
}



export const getTool = async (req, res) => {
    const { id } = req.params
    
    try {
        const tool = await Tool.findById(id)

        res.status(200).send(tool)
    } catch (error) {
        console.log(error)
    }
}

export const getTools = async (req, res) => {
    try{

        const tools = await Tool.find({},'_id numberOfComments numberOfLikes likes')

        res.status(200).json({tools: tools})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const likeATool = async (req, res) => {
    const {id} = req.params

    if (!req.userId) return res.json({message: 'Unauthenticated'})

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({'message':'No tool with that ID'})

    const tool = await Tool.findById(id)
    
    const index = tool.likes.findIndex((id) => id===String(req.userId))

    if (index===-1){
        tool.likes.push(req.userId)
        tool.numberOfLikes += 1
    } else {
        tool.likes = tool.likes.filter((id)=> id!==String(req.userId))
        tool.numberOfLikes -= 1
    }

    await Tool.findByIdAndUpdate(id, tool, {new: true})

    res.status(200).json({"message": "successfully liked"})
}


export const getUniversities = async (req, res) => {
    try{

        const universities = await Universities.find({}, '_id rank name AR ER ISR overal location AppFee')
        res.status(200).json({universities: universities})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const getCountries = async (req, res) => {
    try{

        const countries = await Countries.find({})
        const cities = await Cities.find({})
        res.status(200).json({countries: countries, cities: cities})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const getCosts = async (req, res) => {
    try{

        const costs = await Costs.find({})
        res.status(200).json({costs: costs})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const getJobs = async (req, res) => {
    try{
        const jobs = await Jobs.find({})
        res.status(200).json({jobs: jobs})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const searchJobsByNJ = async (req, res) => {
    try{
        const {nj} = req.body
        const job = await Jobs.findOne({nJ:nj})
        res.status(200).json({job: job})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const searchFieldsByNF = async (req, res) => {
    try{
        const {nf, dt} = req.body
        console.log(nf,dt)
        const field = await Fields.findOne({NF:nf, DT:dt})
        res.status(200).json({field: field})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}


// export const getPostsBySearch = async (req, res) => {
//     const {searchQuery, tags} = req.query
    
//     try {
//         let posts = null
//         if (searchQuery.length==0){
//             posts = await PostMessage.find({ tags: {$in: tags.split(',')} })

//         } else if (tags.length===0){
//             const title = new RegExp(searchQuery, 'i')
//             posts = await PostMessage.find({ title:title })
//         }else{
//             const title = new RegExp(searchQuery, 'i')
//             posts = await PostMessage.find({$or: [ { title:title } , { tags: {$in: tags.split(',')} }]})
//         }
        
//         res.json(posts)

//     } catch (error) {
//         res.status(404).json({message: error.message})
//     }
// }

// export const createPost = async (req, res) => {
//     const post = req.body
//     const newPost = new PostMessage({...post, creator: req.userId, createdAt: new Date().toISOString()})
//     try {
//         await newPost.save()
        
//         res.status(201).json(newPost)
//     } catch (error){
//         res.status(409).json({message: error.message})
//     }
// }


// export const updatePost = async (req, res) => {
//     const {id: _id} = req.params
//     const post = req.body
    
//     if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).json({'message':'No post with that ID'})

//     const updatedPost = await PostMessage.findByIdAndUpdate(_id, {...post, _id}, {new: true})

//     res.json(updatedPost)
// }


// export const deletePost = async (req, res) => {
//     const {id} = req.params
    
//     if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({'message':'No post with that ID'})

//     await PostMessage.findByIdAndRemove(id)

//     res.json({'message':'post deleted!'})
// }

// 

// export const commentPost = async (req, res) => {
//     const { id } = req.params
//     const { value } = req.body

//     const post = await PostMessage.findById(id)

//     post.comments.push(value)

//     const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {new: true})

//     res.json(updatedPost)
// }