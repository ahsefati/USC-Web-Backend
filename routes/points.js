import express from 'express';

import {getAllSources, getAllUsers, getHistogramInfo, getPointsInABox, getPointsInABoxWithFilters, getPointsInATimeRangeWithFilter} from '../controllers/points.js'

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/inabox', getPointsInABox)
router.post('/inaboxwithfilter', getPointsInABoxWithFilters)
router.post('/inatimerangewithfilter', getPointsInATimeRangeWithFilter)
router.get('/allsources', getAllSources)
router.get('/allusers', getAllUsers)
router.post('/gethistograminfo', getHistogramInfo)

export default router