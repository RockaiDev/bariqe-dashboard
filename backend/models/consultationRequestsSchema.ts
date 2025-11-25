import mongoose from "mongoose";
const Schema = mongoose.Schema;

const  ParntersRequestsSchema = new Schema(
  {
     ParntersRequestsName: {
      type: String,
      required: true,
    },
     ParntersRequestsEmail: {
      type: String,
     
      match: [/.+@.+\..+/, "Please fill a valid email address"],
    },
   
    ParntersRequestsPhone: {
      type: String,
      required: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
    },
   
    ParntersRequestsMessage: {
      type: String,
      required: true,
    },
   
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const consultationRequests = mongoose.model(
  " ParntersRequests",
  ParntersRequestsSchema
);
export default consultationRequests;
