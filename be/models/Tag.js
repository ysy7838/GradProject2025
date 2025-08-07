import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
  tagName: { 
    type: String, 
    required: true, 
    maxLength: 15, 
    unique: true,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  versionKey: "__v"
});

tagSchema.index({ usageCount: 1 });

const Tag = mongoose.model("Tag", tagSchema, "tags");

export default Tag;
