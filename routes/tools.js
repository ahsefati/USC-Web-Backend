import express from 'express';

import {getTool, getTools, getUniversities, likeATool, getCountries, getCosts, getJobs, searchJobsByNJ, searchFieldsByNF, getLiveCoinsData, getLiveCoinData, addCash, withdrawCash, buyCoin, sellCoin, getTransactions } from '../controllers/tools.js';

import auth from '../middleware/auth.js';

const router = express.Router();


router.get('/transactions', auth, getTransactions)
router.patch('/buycoin', auth, buyCoin)
router.patch('/sellcoin', auth, sellCoin)
router.patch('/addcash', auth, addCash)
router.patch('/withdrawcash', auth, withdrawCash)
router.get('/livecoinsdata', getLiveCoinsData)
router.post('/livecoindata', getLiveCoinData)



// University Tool Functionalities
router.get('/universities', getUniversities)
// Country Tool Functionalities
router.get('/countries', getCountries)
// Cost Estimation Tool Functionalities
router.get('/generalcosts', getCosts)
// Jobs and Field Search Tool Fnctionalities
router.get('/jobs', getJobs)
router.post('/searchJobsByNJ', searchJobsByNJ)
router.post('/searchFieldsByNF', searchFieldsByNF)

// General functionalities
router.get('/', getTools)
router.get('/:id', getTool)
router.patch('/:id/likeatool', auth, likeATool)



// router.post('/', auth, createPost)
// router.patch('/:id', auth, updatePost)
// router.delete('/:id', auth, deletePost)
// router.post('/:id/commentPost', auth, commentPost)
export default router