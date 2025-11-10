import express from "express";
import adminrouter from "./routes/admin.js";
import userrouter from "./routes/user.js";
import path from "path";
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
const db = import("./config/mongodb-connection.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());


app.get('/',(req,res)=>{
    res.send("Hello world");
});

//admin router
app.use('/admin',adminrouter);
//user router
app.use('/user',userrouter);

app.listen(3000,()=>{
    console.log("App running on port 3000");
});