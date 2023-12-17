import jwt from 'jsonwebtoken'

const auth = async (req, res, next) => {
    try {
        if (req?.headers?.authorization){
            const token = req.headers.authorization.split(" ")[1]
    
            let decodedData
    
            if (token){
                decodedData = jwt.verify(token, process.env.SECRET_KEY_JWT)
    
                req.userId = decodedData?.id
            }
    
            next()
        }else{
            res.status(401).send({error:"Not Authorized!"})
        }
    } catch (error) {
        console.log(error)
    }
}

export default auth