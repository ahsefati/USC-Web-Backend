import express from 'express';

import { saveATool, signin, signup, updateUserInfo, updateUserAvatar, changeUserPass, sendVerificationCode, changeUserPassWithVerificationCode } from '../controllers/users.js';

import auth from '../middleware/auth.js';

const router = express.Router();


router.post('/signin', signin)
router.post('/signup', signup)
router.patch('/sendVerificationCode', sendVerificationCode)
router.patch('/changeUserPassWithVerificationCode', changeUserPassWithVerificationCode)
router.patch('/updateUserInfo', auth, updateUserInfo)
router.patch('/changeUserPass', auth, changeUserPass)
router.patch('/updateUserAvatar', auth, updateUserAvatar)
router.patch('/saveatool/:id', auth, saveATool)

export default router