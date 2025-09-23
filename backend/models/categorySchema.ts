import mongoose from "mongoose";
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },
    categoryDescription: {
      type: String,
      required: true,
    },
    categoryStatus: {
      type: Boolean,
      // default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
        updatedAt: {
      type: Date,
      default: Date.now,
    },

})  

const Category = mongoose.model("Category", categorySchema);
export default Category;