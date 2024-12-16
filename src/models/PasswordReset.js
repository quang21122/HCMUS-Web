import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const PasswordResetSchema = new Schema({
    userId: { type: String },
    resetString: { type: String },
    createdAt: { type: Date, default: Date.now },
    expireAt: { type: Date },
});

const PasswordReset = model('PasswordReset', PasswordResetSchema);

export default PasswordReset; 