import express from 'express';

import {getPointsInABox} from '../controllers/points.js'

import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/inabox', getPointsInABox)

export default router