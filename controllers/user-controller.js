import e from "express";
import User from "../models/user-model.js";
import Otp from "../models/otp-model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "config";
import nodemailer from "nodemailer";
import Product from "../models/products-model.js";
import Category from "../models/categories-model.js";



const user_controllers = {
    login : async (req, res) => {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials.',
                success: false
            });
        }

        const result = await bcrypt.compare(password, user.password);

        if (result) {
            const token = await jwt.sign({uid:user._id,fname:user.first_name,lname:user.last_name},config.get("jwt_secret"));
            res.cookie('token',token);
            res.status(200).json({
                message : "User registered successfully.",
                token: token,
                uname: user.first_name+" "+user.last_name,
                success : true
            });
        } else {
            res.status(401).json({
                message: 'Invalid credentials.',
                success: false
            });
        }
    },

    register : async (req,res)=>{
        let {first_name,last_name,email,phone,password,street,city,zip_code,isEmailVerified} = req.body;
        
        let existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ // 409 Conflict
                    message: "Registration failed! User with this email already exists.",
                    success: false
                });
            }

        try{
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password,salt);
            
            let newUser = await User.insertOne({
                first_name,last_name,email,phone,password:hash,shipping_address:{street,city,zip_code},isEmailVerified
            });

            const token = await jwt.sign({uid:newUser._id,fname:newUser.first_name,lname:newUser.last_name},config.get("jwt_secret"));
            res.cookie('token',token);
            res.status(200).json({
                message : "User registered successfully.",
                token: token,
                uname: newUser.first_name+" "+newUser.last_name,
                success : true
            });
        }

        catch(err){
            console.log(err);
            res.status(500).json({
                message : "User registration failed",
                errMsg : err,
                success : false
            });
        }

    },

    generateOTP : async (req, res) => {
        const userEmail = req.body.email;


        if (!userEmail) {
            return res.status(400).json({ message: "Email is required to generate OTP." });
        }

        let existingUser = await User.findOne({ email:userEmail });
        if (existingUser) {
        // console.log("user exists");
            return res.status(409).json({ // 409 Conflict
                message: "Registration failed! User with this email already exists.",
                success: false
            });
        }

        // OTP Generation
        const code = Math.floor(100000 + Math.random() * 900000).toString(); 

        try {
            await Otp.findOneAndUpdate(
                { email: userEmail },
                { 
                    otpCode: code,
                    createdAt: new Date() 
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            const transporter = nodemailer.createTransport({
                service: 'gmail', 
                auth: {
                    user: config.get('EMAIL_USER'), 
                    pass: config.get('EMAIL_PASSWORD'), 
                },
            });

            const mailOptions = {
                from: config.get('EMAIL_USER'),
                to: userEmail,
                subject: '🔐 Your One-Time Password (OTP) - Valid for 2 Minutes',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
                        <h2 style="color: #007bff; text-align: center;">OTP Verification Code</h2>
                        <p style="text-align: center;">Hello,</p>
                        <p style="text-align: center;">Use the following **One-Time Password** (OTP) to complete your verification process. This code is valid for **2 minutes**.</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; color: #333; background-color: #f0f8ff; padding: 15px 25px; border-radius: 8px; display: inline-block; letter-spacing: 5px; border: 2px dashed #007bff;">
                                ${code}
                            </span>
                        </div>
                        <p style="text-align: center; color: #dc3545; font-weight: bold;">DO NOT share this code with anyone.</p>
                        <p style="font-size: 12px; color: #777; text-align: center; margin-top: 30px;">This is a system-generated email. Please do not reply.</p>
                    </div>
                `,
            };

            const info = await transporter.sendMail(mailOptions);

            res.status(200).json({ 
                message: `OTP successfully generated and sent to ${userEmail}.`,
                success : true
            });

        } catch (error) {
            console.error('Error in generateAndSendOtp:', error);
            
            res.status(500).json({ message : "Failed to send OTP email or database error occurred.", 
                error : error.message,
                success : false
            });
        }
    },

    verifyOTP : async (req,res)=>{
        let {email,otp} = req.body;

        const otpOrg = await Otp.findOne({email});

        if(otpOrg == null){
            res.status(500).json({
                err : "Verification failed!",
                success : false
            })
        }

        if(otpOrg.otpCode == otp){
            await Otp.findOneAndDelete({_id : otpOrg._id});
            res.status(200).json({
                message : "Email verified successfully.",
                success : true
            });
        }else{
            res.status(401).json({
                err : "Email verification failed!",
                success : false
            });
        }

    },

    getProducts : async (req, res) => {
        try {
            // 1. Fetch all products and replace the 'category' ID 
            // with the full category document (population)
            const products = await Product.find({})
                .populate('category'); // Ensure 'Category' model name matches the 'ref' in Product schema

            // 2. Map over the populated products to clean up Decimal128 types
            const cleanProducts = products.map(product => {
                // Convert Mongoose document to a plain JavaScript object
                const productObj = product.toObject(); 

                // Convert Decimal128 'price' to a floating-point number
                productObj.price = product.price ? parseFloat(product.price.toString()) : 0;
                
                // Convert Decimal128 'average_rating' to a floating-point number
                if (productObj.popularity_matrix && productObj.popularity_matrix.average_rating) {
                    productObj.popularity_matrix.average_rating = 
                        parseFloat(product.popularity_matrix.average_rating.toString());
                }

                // NOTE: The category object itself (productObj.category) will now be a 
                // regular object because it came from a different document and was populated.
                
                return productObj;
            });

            // 3. Send the cleaned, well-formatted product data
            res.status(200).json(cleanProducts); 
            
        } catch (error) {
            console.error("Error fetching and populating products:", error);
            res.status(500).json({
                message: "Failed to fetch products due to a server error.",
                error: error.message
            });
        }
    },

    getCategories : async (req, res) => {
        try {
            const categories = await Category.find({},{name:1}); 

            res.status(200).json(categories); 
            
        } catch (error) {
            console.error("Error fetching and populating products:", error);
            res.status(500).json({
                message: "Failed to fetch products due to a server error.",
                error: error.message
            });
        }
    },

    addToCart : async(req,res)=>{
            let {Quantity,pid} = req.body;
            Quantity = Quantity || 1; 
        
            let user = await User.findOne({_id: req.user.uid}).populate('cart');
            let product = await Product.findOne({_id: pid});
            // price = ((product.productprice * (1 - product.discount / 100)) * quantity).toFixed(2);
            // Check if the product is already in the wishlist to avoid duplicates
            const cartItem = user.cart.find(item => item.pid.toString() === req.body.pid);
                if (!cartItem) {
                    user.cart.push({pid: req.body.pid,Quantity:1,});
                    await user.save();
                    res.status(200).json({message:"Product added",success:true});
                } else {
                    // console.log("Product already in cart.");
                    // cartItem.Quantity += Quantity;
                    // await user.save();
                    res.status(200).json({message:"Product exists",success:false});
                    // req.flash('error_msg',"Product already in cart")
                }
        
                // user = await User.findOne({_id: req.params.uid}).populate('cart');
            // user.wishlist.push(req.params.pid);
            // await user.save();
            // res.status(200).json(user);
        },

    updateQuantity : async(req,res)=>{
            let {pid,value} = req.body;
            value = value || 1; 
        
            let user = await User.findOne({_id: req.user.uid}).populate('cart');
            let product = await Product.findOne({_id: pid});
            // price = ((product.productprice * (1 - product.discount / 100)) * quantity).toFixed(2);
            // Check if the product is already in the wishlist to avoid duplicates
            const cartItem = user.cart.find(item => item.pid.toString() === req.body.pid);
                if (cartItem) {
                    cartItem.Quantity = Number(cartItem.Quantity) + Number(value);
                    if(cartItem.Quantity != 0)
                        await user.save();
                    res.status(200).json({message:"Quantity updated",success:true});
                }else{
                    res.status(200).json({message:"Product not exists",success:false});
                }
        
                // user = await User.findOne({_id: req.params.uid}).populate('cart');
            // user.wishlist.push(req.params.pid);
            // await user.save();
            // res.status(200).json(user);
        },

    removeFromCart : async (req, res) => {
        const { pid } = req.body; // Assuming the product ID to remove is in the request body
        const userId = req.user.uid; // Get the user ID from the JWT token in req.user

        if (!pid) {
            return res.status(400).json({ message: "Product ID is required for removal.", success: false });
        }

        try {
            // Use findOneAndUpdate with the $pull operator to remove the item
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId }, // 1. Find the user document
                { 
                    // 2. $pull removes all elements from the 'cart' array 
                    //    that match the specified condition (pid equals the requested pid)
                    $pull: { cart: { pid: pid } } 
                },
                { 
                    new: true, // Return the document AFTER the update is applied
                    projection: { cart: 1 } // Only return the cart field to keep the response light
                }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found.", success: false });
            }
            
            // Success: The product was either removed or was not present
            return res.status(200).json({
                message: "Product successfully removed from the cart (if it existed).",
                // cart: updatedUser.cart,
                success: true
            });

        } catch (error) {
            console.error('Error removing product from cart:', error);
            return res.status(500).json({ 
                message: "Server error occurred while removing product.", 
                error: error.message,
                success: false 
            });
        }
    },
    
    getCart : async(req,res)=>{
        const user = await User.findOne({_id:req.user.uid}).select('cart');
        res.send(user);
    },

    addToWish : async(req,res)=>{
            let {pid} = req.body;
        
            let user = await User.findOne({_id: req.user.uid});
            // let product = await Product.findOne({_id: pid});
            // price = ((product.productprice * (1 - product.discount / 100)) * quantity).toFixed(2);
            // Check if the product is already in the wishlist to avoid duplicates
            const wishlistItem = user.wishlist.find(item => item.toString() === pid);
                if (!wishlistItem) {
                    user.wishlist.push(pid);
                    await user.save();
                    res.status(200).json({message:"Product added to wish",success:true});
                } else {
                    // console.log("Product already in cart.");
                    // cartItem.Quantity += Quantity;
                    // await user.save();
                    res.status(401).json({message:"Product exists in wish",success:false});
                    // req.flash('error_msg',"Product already in cart")
                }
        
                // user = await User.findOne({_id: req.params.uid}).populate('cart');
            // user.wishlist.push(req.params.pid);
            // await user.save();
            // res.status(200).json(user);
        },

    removeFromWish : async (req, res) => {
        const { pid } = req.body; // Assuming the product ID to remove is in the request body
        const userId = req.user.uid; // Get the user ID from the JWT token in req.user

        if (!pid) {
            return res.status(400).json({ message: "Product ID is required for removal.", success: false });
        }

        try {
            // Use findOneAndUpdate with the $pull operator to remove the item
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId }, // 1. Find the user document
                { 
                    // 2. $pull removes all elements from the 'cart' array 
                    //    that match the specified condition (pid equals the requested pid)
                    $pull: { wishlist: pid } 
                },
                { 
                    new: true, // Return the document AFTER the update is applied
                    projection: { wishlist: 1 } // Only return the cart field to keep the response light
                }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found.", success: false });
            }
            
            // Success: The product was either removed or was not present
            return res.status(200).json({
                message: "Product successfully removed from the cart (if it existed).",
                // cart: updatedUser.cart,
                success: true
            });

        } catch (error) {
            console.error('Error removing product from cart:', error);
            return res.status(500).json({ 
                message: "Server error occurred while removing product.", 
                error: error.message,
                success: false 
            });
        }
    },

    getWishlist : async(req,res)=>{
        const user = await User.findOne({_id:req.user.uid}).select('wishlist');
        res.send(user);
    },


}

export default user_controllers;