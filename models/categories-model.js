import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, 
        trim: true,
        text: true 
    },
    description: {
        type: String,
        default: ""
    },

}, {
    timestamps: true 
});

// Optional: Create an index for faster category lookup by name and slug
// categorySchema.index({ name: 1});

const Category = mongoose.model('Category', categorySchema);
export default Category;