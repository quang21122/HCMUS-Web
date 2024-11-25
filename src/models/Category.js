import { Schema, model } from 'mongoose';

const CategorySchema = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true,
        auto: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    child: {
        type: [String],
        required: false
    }
});

const Category = model('Category', CategorySchema);

export default Category;