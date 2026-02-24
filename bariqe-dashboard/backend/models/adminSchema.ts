import mongoose from "mongoose";
const Schema = mongoose.Schema;

const adminSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: "admin",
    },
    coverImage: {
      type: String,
      default: ""
    },
    avatar: {
      type: String,
      default: ""
    },
    profilePicture: {
      type: String,
      default: ""
    },
   
  },
  {
    timestamps: true,
  }
);

const admin = mongoose.model("Admin", adminSchema);
export default admin;