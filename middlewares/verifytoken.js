import jwt from "jsonwebtoken";
import config from "config";

const verifytoken = (req,res,next)=>{
    if(req.body.token){
        // console.log("Token present: ",req.body.token);
        try {
            const decodedUser = jwt.verify(req.body.token,config.get("jwt_secret"));
            req.user = decodedUser;
            next();
        } catch (error) {
            res.status(401).json({msg:"Something went wrong."});
        }
        
    }else{
        console.log("token not present");
        res.status(401).json({msg:"Please login first."});
    }
}


export default verifytoken;