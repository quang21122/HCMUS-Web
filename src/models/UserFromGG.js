import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';


const userGoogleSchema = new Schema({
    googleID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    
});

const UserGG = mongoose.model('UserGG', userGoogleSchema);

export default UserGG;