import mongoose from "mongoose";
import PostMessage from "../models/postMessage.js"


export const getPost = async (req, res) => {
    const { id } = req.params
    
    try {
        const post = await PostMessage.findById(id)

        res.status(200).send(post)
    } catch (error) {
        console.log(error)
    }
}

export const getPosts = async (req, res) => {
    try{
        const {page} = req.query

        const LIMIT = 8
        const startIndex = (Number(page) - 1) * LIMIT //get the starting post index of a page
        const total = await PostMessage.countDocuments({})

        const posts = await PostMessage.find().sort({_id:-1}).limit(LIMIT).skip(startIndex)


        res.status(200).json({data: posts, currentPage: Number(page), numberOfPages: Math.ceil(total/LIMIT)})

    } catch (error){
        res.status(404).json({message:error.message})
    }
}

export const getPostsBySearch = async (req, res) => {
    const {searchQuery, tags} = req.query
    
    try {
        let posts = null
        if (searchQuery.length==0){
            posts = await PostMessage.find({ tags: {$in: tags.split(',')} })

        } else if (tags.length===0){
            const title = new RegExp(searchQuery, 'i')
            posts = await PostMessage.find({ title:title })
        }else{
            const title = new RegExp(searchQuery, 'i')
            posts = await PostMessage.find({$or: [ { title:title } , { tags: {$in: tags.split(',')} }]})
        }
        
        res.json(posts)

    } catch (error) {
        res.status(404).json({message: error.message})
    }
}

export const createPost = async (req, res) => {
    const post = req.body
    const newPost = new PostMessage({...post, creator: req.userId, createdAt: new Date().toISOString()})
    try {
        await newPost.save()
        
        res.status(201).json(newPost)
    } catch (error){
        res.status(409).json({message: error.message})
    }
}


export const updatePost = async (req, res) => {
    const {id: _id} = req.params
    const post = req.body
    
    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).json({'message':'No post with that ID'})

    const updatedPost = await PostMessage.findByIdAndUpdate(_id, {...post, _id}, {new: true})

    res.json(updatedPost)
}


export const deletePost = async (req, res) => {
    const {id} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({'message':'No post with that ID'})

    await PostMessage.findByIdAndRemove(id)

    res.json({'message':'post deleted!'})
}

export const likePost = async (req, res) => {
    const {id} = req.params

    if (!req.userId) return res.json({message: 'Unauthenticated'})

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({'message':'No post with that ID'})

    const post = await PostMessage.findById(id)
    
    const index = post.likes.findIndex((id) => id===String(req.userId))

    if (index===-1){
        post.likes.push(req.userId)
    } else {
        post.likes = post.likes.filter((id)=> id!==String(req.userId))
    }

    const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {new: true})

    res.json(updatedPost)
}

export const commentPost = async (req, res) => {
    const { id } = req.params
    const { value } = req.body

    const post = await PostMessage.findById(id)

    post.comments.push(value)

    const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {new: true})

    res.json(updatedPost)
}