import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    verificationCode: {
      type: Number,
      max: 999999,
    },
    verificationExpires: {
      type: Date,
    },
    deleteRequestDate: {
      type: Date,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {versionKey: false}
);

const User = mongoose.model("User", userSchema);
export default User;
