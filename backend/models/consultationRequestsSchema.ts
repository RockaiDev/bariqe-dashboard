import mongoose from "mongoose";
const Schema = mongoose.Schema;

const consultationRequestsSchema = new Schema(
  {
    ConsultationRequestsName: {
      type: String,
      required: true,
    },
    ConsultationRequestsEmail: {
      type: String,
     
      match: [/.+@.+\..+/, "Please fill a valid email address"],
    },
    customers:{
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    ConsultationRequestsPhone: {
      type: String,
      required: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
    },
    consultationRequestsArea:{
      type: String,
  
    } ,
    ConsultationRequestsMessage: {
      type: String,
      required: true,
    },
    ConsultationRequestsStatus: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
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
  "ConsultationRequests",
  consultationRequestsSchema
);
export default consultationRequests;
