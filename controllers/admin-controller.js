import e from "express";
import Category from "../models/categories-model.js";
import Product from "../models/products-model.js";


const admin_controllers = {
    defaultRoute : (req,res)=>{
        res.send("This is home route from admin");
    },

    addProduct : async(req,res)=>{
        let {name,imageUrl,manufacturer,category,description,stock_quantity,price,attributes,popularity_matrix,keywords,is_available} = req.body;

        let newproduct = await Product.insertOne({name,imageUrl,manufacturer,category,description,stock_quantity,price,attributes,popularity_matrix,keywords,is_available})
                        .then(()=>{
                            res.send("data inserted");
                        }).catch((err)=>{
                            console.log(err);
                            res.send(err);
                        });
    },

    createCategory : async(req,res)=>{
        let {name,description} = req.body;

        if(name == "" || description==""){
            res.send("failed");
        }

        const category =await Category.findOne({name});

        if(category){
            res.status(401).json({
                message: "Creation failed!",
                success: false
            });
        }else{
            const newCategory = await Category.insertOne({name,description})
            .then(()=>{
                res.status(200).json({
                    message: "Category created",
                    success: true
                });
            })
            .catch((err)=>{
                res.send(err);
            });
        }

    }
}


export default admin_controllers;