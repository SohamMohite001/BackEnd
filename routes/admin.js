import express from 'express';
const adminrouter = express.Router();
import admin_controllers from '../controllers/admin-controller.js';


adminrouter.get('/',admin_controllers.defaultRoute);

adminrouter.post('/product/create',admin_controllers.addProduct);

adminrouter.post('/category/create',admin_controllers.createCategory);


export default adminrouter;