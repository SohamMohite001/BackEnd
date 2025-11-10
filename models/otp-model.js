import mongoose from 'mongoose';

// Define the schema for storing OTPs
const OtpSchema = new mongoose.Schema({
    // The user's identifier (e.g., email or phone number)
    // This is used to look up the correct OTP when the user attempts to verify.
    email: {
        type: String,
        required: true,
        unique: true, // Only one active OTP per user at a time
    },

    // The generated OTP code
    otpCode: {
        type: String,
        required: true,
    },

    // The creation timestamp field. This field is CRUCIAL for the TTL index.
    // MongoDB reads this timestamp to determine when the document should expire.
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
});

/*
 * ===============================================
 * CRITICAL STEP: Defining the TTL Index
 * ===============================================
 *
 * This line creates a TTL index on the 'createdAt' field.
 * 'expires': 120 tells MongoDB to automatically delete any document 
 * where the 'createdAt' timestamp is 120 seconds (2 minutes) old.
 * * Note: MongoDB's background deletion process runs every 60 seconds, 
 * so the deletion is not guaranteed to be instantaneous, but it will 
 * occur shortly after the 120-second threshold.
 */
OtpSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 120 });

// Create and export the Mongoose model
const Otp = mongoose.model('Otp', OtpSchema);

export default Otp;
