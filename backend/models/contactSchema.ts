import mongoose from "mongoose";
const Schema = mongoose.Schema;

const contactSchema = new Schema({
    contactName: {
        type: String,
        required: true,
        trim: true
    },
     email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    customer:{
     type: Schema.Types.ObjectId,
    ref: "Customer",
    required: false,
  },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    address:{
        type: String,
        trim: true
    },
    services: [{
        type: String,
        enum: [
            'Technical Training & Consultation',
            'Equipment Sales & Solutions',
            'Quality Assurance & Validation',
            'Custom Chemical Solutions',
            'Laboratory Setup & Support',
            'Regulatory Compliance & Documentation',
            'Maintenance & After-Sales Support',
            'Research & Development Solutions'
        ]
    }],
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type:Boolean,
        default:false
    }
}, {
    timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;