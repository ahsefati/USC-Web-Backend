import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import mongoose from "mongoose";
import sgMail from '@sendgrid/mail'

export const signin = async (req, res) => {
    const {email, password} = req.body

    try {
        const existingUser = await User.findOne({email})

        if (!existingUser) return res.status(404).json({message: 2})
        
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

        if (!isPasswordCorrect) return res.status(400).json({message: 1})

        const token = jwt.sign({email: existingUser.email, id: existingUser._id}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

        res.status(200).json({result: existingUser, token: token})

    } catch (error) {
        res.status(500).json({message: "Something went wrong!"})
    }

}

export const signup = async (req, res) => {
    const {email, password, fullname, confirmPassword, isFromGoogle} = req.body

    try {
        const existingUser = await User.findOne({email})
        
        if (password!==confirmPassword) return res.status(400).json({message: 1})
        
        if (existingUser && !isFromGoogle) return res.status(400).json({message: 2})

        if (existingUser && isFromGoogle){

            const token = jwt.sign({email: existingUser.email, id: existingUser._id}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

            res.status(200).json({result: existingUser, token: token})

        } else if(!existingUser && isFromGoogle){
            
            const result = await User.create({email, password: "__FromGoogleUser__", name: fullname})
            const token = jwt.sign({email: result.email, id: result._id}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})
            res.status(200).json({result: result, token: token})

        }else{

            const hashedPassword = await bcrypt.hash(password, 12)    
            const result = await User.create({email, password: hashedPassword, name: fullname})
            const token = jwt.sign({email: result.email, id: result._id}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})
            res.status(200).json({result: result, token: token})
        
        }

    } catch (error) {
        res.status(500).json({message: "Something went wrong!"})
    }
}


export const updateUserInfo = async (req, res) => {
    if (!req.userId) return res.json({message: 'Unauthenticated'})

    const {country, state, phone, telegramId, instagramId, website, theme, visibility} = req.body

    const user = await User.findById(req.userId)

    user.country = country
    user.state = state
    user.phone = phone
    user.telegramId = telegramId
    user.instagramId = instagramId
    user.website = website
    user.theme = theme
    user.visibility = visibility

    const updatedUser = await User.findByIdAndUpdate(req.userId, user, {new: true})
    const token = jwt.sign({email: user.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

    res.status(200).json({result: updatedUser, token: token})
}

export const updateUserAvatar = async (req, res) => {
    if (!req.userId) return res.json({message: 'Unauthenticated'})

    const {avatar} = req.body

    const user = await User.findById(req.userId)
    user.avatar = avatar

    const updatedUser = await User.findByIdAndUpdate(req.userId, user, {new: true})
    const token = jwt.sign({email: user.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

    res.status(200).json({result: updatedUser, token: token})
}

export const saveATool = async (req, res) => {
    if (!req.userId) return res.json({message: 'Unauthenticated'})

    const {id} = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({'message':'No tool with that ID'})

    const user = await User.findById(req.userId)

    const index = user.savedTools.findIndex((idOfTool) => idOfTool===String(id))
    
    if (index===-1){
        user.savedTools.push(id)
    }else{
        user.savedTools = user.savedTools.filter((idOfTool)=> idOfTool!==String(id))
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, user, {new: true})
    const token = jwt.sign({email: user.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

    res.status(200).json({result: updatedUser, token: token})

}

export const changeUserPass = async (req, res) => {
    if (!req.userId) return res.json({message: 'Unauthenticated'})

    const {currentPass, newPass} = req.body
    console.log(currentPass, newPass)
    const user = await User.findById(req.userId)

    // Check if the current password is correct:
    const isPasswordCorrect = await bcrypt.compare(currentPass, user.password)
    if (!isPasswordCorrect) return res.status(400).json({message: 1})

    const hashedPassword = await bcrypt.hash(newPass, 12) 
    user.password = hashedPassword

    const updatedUser = await User.findByIdAndUpdate(req.userId, user, {new: true})
    const token = jwt.sign({email: user.email, id: req.userId}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

    res.status(200).json({result: updatedUser, token: token})
}


export const sendVerificationCode = async (req, res) => {
    const {userEmail} = req.body
    const existingUser = await User.findOne({email:userEmail})
    if (!existingUser) return res.status(404).json({message: 2})

    // generate a 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000) 
    
    // Send an email which has the verification code in it
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        const msg = {
        to: userEmail, // Change to your recipient
        from: 'ahsefati77@gmail.com', // Change to your verified sender
        subject: 'Forgot Password | KOOCH Platform',
        text: 'Hi there! \n As you requested, you can find your verification code in this email. You will need this code to change your password on KOOCH.\nYour verification code is: ' + verificationCode + '\nNote: Do not share this code with anyone.\n\nPlease ignore this message if you have not requested for it on the Kooch Platform. \n\n\n Regards, Amirhossein Sefati',
        }
        sgMail
        .send(msg)
        .then(async () => {
            existingUser.verificationCode = verificationCode
            // to update the verification code
            const updatedUser = await User.findOneAndUpdate({email:userEmail}, existingUser, {new: true})
        
            res.status(200).json({message:0})
        })
        .catch((error) => {
            console.error(error)
            res.status(200).json({message:1})
        })

}

export const changeUserPassWithVerificationCode = async (req, res) => {
    const {userEmail, verificationCode, newPass} = req.body
    const existingUser = await User.findOne({email:userEmail})
    if (!existingUser) return res.status(404).json({message: 2})

    // Check if the verification code is correct:
    const isVerificationCodeCorrect = (verificationCode===existingUser.verificationCode)
    if (!isVerificationCodeCorrect) return res.status(400).json({message: 1})

    const hashedPassword = await bcrypt.hash(newPass, 12) 
    existingUser.password = hashedPassword

    const updatedUser = await User.findOneAndUpdate({email:userEmail}, existingUser, {new: true})
    const token = jwt.sign({email: updatedUser.email, id: updatedUser._id}, process.env.SECRET_KEY_JWT, {expiresIn:"10d"})

    res.status(200).json({result: updatedUser, token: token})
}