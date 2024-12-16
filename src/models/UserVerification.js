import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const userVerificationSchema = new Schema({
    userID: { type: String },
    uniqueString: { type: String },
    createdAt: { type: Date, default: Date.now },
    expireAt: { type: Date },
});

const UserVerification = model('UserVerification', userVerificationSchema);

export default UserVerification;