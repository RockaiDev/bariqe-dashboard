// models/businessInfoSchema.ts
import mongoose from "mongoose";
const Schema = mongoose.Schema;

// 🎨 Schema for About Sections
const aboutSectionSchema = new Schema({
  hero_image: { type: String, required: true },
  title_ar: { type: String },
  title_en: { type: String },
  description_ar: { type: String },
  description_en: { type: String },
  display_order: { type: Number, default: 0 },
});

// 👥 Schema for team members
const memberSchema = new Schema({
  name_ar: { type: String, required: true },
  name_en: { type: String, required: true },
  position_ar: { type: String },
  position_en: { type: String },
  bio_ar: { type: String },
  bio_en: { type: String },
  image: { type: String },
  email: { type: String },
  phone: { type: String },
  linkedin: { type: String },
  is_leadership: { type: Boolean, default: false },
  display_order: { type: Number, default: 0 },
});

// 🤝 Schema for business partners
const partnerSchema = new Schema({
  name_ar: { type: String, required: true },
  name_en: { type: String, required: true },
  description_ar: { type: String },
  description_en: { type: String },
  image: { type: String },
  website: { type: String },
  display_order: { type: Number, default: 0 },
});

// 📍 Schema for locations
const locationSchema = new Schema({
  country_ar: { type: String },
  country_en: { type: String },
  city_ar: { type: String },
  city_en: { type: String },
  address_ar: { type: String },
  address_en: { type: String },
  phone: { type: String },
  email: { type: String },
  map_url: { type: String },
});

// ⭐ Schema for reviews/testimonials
const reviewSchema = new Schema({
  client_name_ar: { type: String, required: true },
  client_name_en: { type: String, required: true },
  client_position_ar: { type: String },
  client_position_en: { type: String },
  client_company_ar: { type: String },
  client_company_en: { type: String },
  client_image: { type: String },
  review_ar: { type: String, required: true },
  review_en: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  is_featured: { type: Boolean, default: false },
  display_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

// 📋 Main business information schema
const businessInfoSchema = new Schema(
  {
    // Basic Information
    title_ar: { type: String, required: true },
    title_en: { type: String, required: true },
    description_ar: { type: String },
    description_en: { type: String },
    logo: { type: String },

    // Contact Information
    email: { type: String },
    phone: { type: String },
    whatsapp: { type: String },
    address_ar: { type: String },
    address_en: { type: String },
    facebook: { type: String },

    // About Section
    about: {
      hero_image: { type: String },
      main_title_ar: { type: String },
      main_title_en: { type: String },
      main_description_ar: { type: String },
      main_description_en: { type: String },
      sections: [aboutSectionSchema],
    },

    // Locations
    locations: [locationSchema],

    // Team Members
    members: [memberSchema],

    // Business Partners
    partners: [partnerSchema],

    // Reviews/Testimonials
    reviews: {
      hero_image: { type: String },
      main_title_ar: { type: String, default: "آراء عملائنا" },
      main_title_en: { type: String, default: "Client Reviews" },
      main_description_ar: { type: String, default: "نفتخر بثقة عملائنا" },
      main_description_en: {
        type: String,
        default: "We are proud of our clients trust",
      },
      items: [reviewSchema],
    },

    // Status
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for better performance
businessInfoSchema.index({ is_active: 1 });
businessInfoSchema.index({ "about.sections.display_order": 1 });
businessInfoSchema.index({ "members.display_order": 1 });
businessInfoSchema.index({ "partners.display_order": 1 });
businessInfoSchema.index({ "reviews.items.display_order": 1 });
businessInfoSchema.index({ "reviews.items.is_featured": 1 });

const BusinessInfo = mongoose.model("BusinessInfo", businessInfoSchema);
export default BusinessInfo;
