import mongoose from "mongoose";
import config from "config";

const connection = mongoose.connect(`${config.get("mongodb_url")}`)
.then(()=>{
    console.log("Mongodb Connected Successfully.");
}).catch((err)=>{
    console.error("Mongodb Connection",err);
});

