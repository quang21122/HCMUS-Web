import { Schema, model } from "mongoose";

const tagSchema = new Schema({
  _id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const Tag = model("Tag", tagSchema);

export default Tag;
