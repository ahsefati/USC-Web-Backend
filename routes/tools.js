import express from 'express';

import {getTool, getTools, getUniversities, likeATool, getCountries, getCosts, getJobs, searchJobsByNJ, searchFieldsByNF } from '../controllers/tools.js';

import auth from '../middleware/auth.js';

const router = express.Router();


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