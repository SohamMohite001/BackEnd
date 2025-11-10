import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true, // Recommended: Remove whitespace from ends
        text: true // Recommended: Enable text indexing for searching
    },
    imageUrl: [{ 
        type: String,
        required: true
    }],
    manufacturer: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
        required: true
    },
    description: String,

    // --- Inventory & Pricing ---
    stock_quantity: {
        type: Number,
        required: true,
        min: 0, // Recommended: Ensure quantity is non-negative
        default: 0
    },
    price: {
        // Keeping Decimal128 for high precision, but Number is a valid alternative
        type: mongoose.Types.Decimal128, 
        required: true,
        min: 0, // Recommended: Ensure price is non-negative
        default: 0
    },

    // --- Dynamic Data ---
    attributes: {
        // mongoose.Schema.Types.Mixed is correct for a flexible key/value object
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // --- Popularity & Reviews ---
    popularity_matrix: {
        views: {
            type: Number,
            default: 0
        },
        sales_count: {
            type: Number,
            default: 0
        },
        reviews_count: {
            type: Number,
            default: 0
        },
        average_rating: {
            // Keeping Decimal128 or could switch to Number (with max: 5)
            type: mongoose.Types.Decimal128, 
            default: 0
        }
    },

    // FIX: Corrected default from {} to []
    keywords: {
        type: [String], // Concise array of strings syntax
        default: []
    },

    // --- Status ---
    is_available: {
        type: Boolean,
        default: true // Recommended: Set a default for clarity
    },
}, {
    timestamps: true 
});

const Product = mongoose.model('product', productSchema);
export default Product;