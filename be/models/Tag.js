import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
  tagName: { type: String, required: true, maxLength: 15, unique: true }
});

const Keyword = mongoose.model("Tag", tagSchema, "tags");

export default Keyword;
