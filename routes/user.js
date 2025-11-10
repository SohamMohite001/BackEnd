import express from "express";
import user_controllers from "../controllers/user-controller.js";
import verifytoken from "../middlewares/verifytoken.js";
const userrouter = express.Router();


userrouter.post('/register',user_controllers.register);
userrouter.post('/login',user_controllers.login);
userrouter.post('/generateOTP',user_controllers.generateOTP);
userrouter.post('/verifyOTP',user_controllers.verifyOTP);
userrouter.get('/products/get',user_controllers.getProducts);
userrouter.get('/categories/get',user_controllers.getCategories);
userrouter.route('/addToCart').post(verifytoken,user_controllers.addToCart);
userrouter.route('/updateQuantity').post(verifytoken,user_controllers.updateQuantity);
userrouter.route('/removeFromCart').post(verifytoken,user_controllers.removeFromCart);
userrouter.route('/getCart').post(verifytoken,user_controllers.getCart);
userrouter.route('/addToWish').post(verifytoken,user_controllers.addToWish);
userrouter.route('/removeFromWish').post(verifytoken,user_controllers.removeFromWish);
userrouter.route('/getWishlist').post(verifytoken,user_controllers.getWishlist);



export default userrouter;