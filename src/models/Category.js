import { Schema, model } from 'mongoose';

const CategorySchema = new Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  parent: {
    type: String,
    required: false,
  },
});

const Category = model('Category', CategorySchema);

const categories = {
    
}

export default Category;