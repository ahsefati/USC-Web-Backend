import express from 'express';

import {getAllSources, getPointsInABox, getPointsInABoxWithFilters} from '../controllers/points.js'

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/inabox', getPointsInABox)
router.post('/inaboxwithfilter', getPointsInABoxWithFilters)
router.get('/allsources', getAllSources)

export default router