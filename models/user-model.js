import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
    first_name : {
        type : String,
        required : true
    },
    last_name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true
    },
    phone : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    cart : [{
            pid : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'product'
            },
            Quantity : {
            type : Number,
            default : 1
            }
        }],
    // orders : [{
    //         type : mongoose.Schema.Types.ObjectId,
    //         ref : 'order'
    //     }],
    wishlist : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    }],
    shipping_address : {
        street : {
            type : String,
            required : true
        },
        city : {
            type : String,
            required : true
        },
        zip_code : {
            type : String,
            required : true
        }
    },
    isEmailVerified : {
        type : Boolean,
        default : false
    }
},
{
    timestamps : true
});


const User = mongoose.model('user',UserSchema);
export default User;