import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import BusinessInfoModel from "../../../models/businessInfoSchema";
import { pick } from "lodash";

export default class BusinessInfoService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "title_ar",
      "title_en",
      "description_ar",
      "description_en",
      "logo",
      "email",
      "phone",
      "whatsapp",
      "address_ar",
      "address_en",
      "facebook",
      "about",
      "locations",
      "members",
      "partners",
      "reviews",
      "is_active",
    ];
  }

  // ============================================
  // 🟢 GENERAL METHODS
  // ============================================

  public async GetBusinessInfo() {
    try {
      let businessInfo = await BusinessInfoModel.findOne({ is_active: true });
      if (!businessInfo) {
        return null;
      }
      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async GetBusinessInfoById(id: string) {
    try {
      const businessInfo = await BusinessInfoModel.findById(id);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }
      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpsertBusinessInfo(body: any, id?: string) {
    try {
      const updateData = pick(body, this.keys);
      let businessInfo;

      if (id) {
        businessInfo = await BusinessInfoModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );
        if (!businessInfo) {
          throw new ApiError(
            "NOT_FOUND",
            `Business info with id ${id} not found`
          );
        }
      } else {
        const existing = await BusinessInfoModel.findOne({});
        if (existing) {
          businessInfo = await BusinessInfoModel.findByIdAndUpdate(
            existing._id,
            updateData,
            { new: true, runValidators: true }
          );
        } else {
          businessInfo = await BusinessInfoModel.create(updateData);
        }
      }

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // 📖 ABOUT SECTIONS METHODS
  // ============================================

  public async AddAboutSection(businessInfoId: string, sectionData: any) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }
  
      if (!businessInfo.about) {
        businessInfo.set('about', {
          sections: [sectionData]
        });
      } else {
        businessInfo.about.sections.push(sectionData);
      }
      
      await businessInfo.save();
      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdateAboutSettings(
    businessInfoId: string,
    settings: {
      hero_image?: string;
      main_title_ar?: string;
      main_title_en?: string;
      main_description_ar?: string;
      main_description_en?: string;
    }
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }
  
      if (!businessInfo.about) {
        businessInfo.set('about', {
          hero_image: '',
          main_title_ar: '',
          main_title_en: '',
          main_description_ar: '',
          main_description_en: '',
          sections: []
        });
      }
  
      if (settings.hero_image !== undefined) {
        businessInfo.about.hero_image = settings.hero_image;
      }
      if (settings.main_title_ar !== undefined) {
        businessInfo.about.main_title_ar = settings.main_title_ar;
      }
      if (settings.main_title_en !== undefined) {
        businessInfo.about.main_title_en = settings.main_title_en;
      }
      if (settings.main_description_ar !== undefined) {
        businessInfo.about.main_description_ar = settings.main_description_ar;
      }
      if (settings.main_description_en !== undefined) {
        businessInfo.about.main_description_en = settings.main_description_en;
      }
  
      businessInfo.markModified('about');
      
      await businessInfo.save();
      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdateAboutSection(
    businessInfoId: string,
    sectionId: string,
    sectionData: any
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      const section = businessInfo.about?.sections.id(sectionId);
      if (!section) {
        throw new ApiError("NOT_FOUND", "About section not found");
      }

      Object.assign(section, sectionData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async DeleteAboutSection(businessInfoId: string, sectionId: string) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.about?.sections.pull(sectionId);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // 👥 MEMBERS METHODS
  // ============================================

  public async AddMember(businessInfoId: string, memberData: any) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.members.push(memberData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdateMember(
    businessInfoId: string,
    memberId: string,
    memberData: any
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      const member = businessInfo.members.id(memberId);
      if (!member) {
        throw new ApiError("NOT_FOUND", "Member not found");
      }

      Object.assign(member, memberData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async DeleteMember(businessInfoId: string, memberId: string) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.members.pull(memberId);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // 🤝 PARTNERS METHODS
  // ============================================

  public async AddPartner(businessInfoId: string, partnerData: any) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.partners.push(partnerData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdatePartner(
    businessInfoId: string,
    partnerId: string,
    partnerData: any
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      const partner = businessInfo.partners.id(partnerId);
      if (!partner) {
        throw new ApiError("NOT_FOUND", "Partner not found");
      }

      Object.assign(partner, partnerData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async DeletePartner(businessInfoId: string, partnerId: string) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.partners.pull(partnerId);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // 📍 LOCATIONS METHODS
  // ============================================

  public async AddLocation(businessInfoId: string, locationData: any) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.locations.push(locationData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdateLocation(
    businessInfoId: string,
    locationId: string,
    locationData: any
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      const location = businessInfo.locations.id(locationId);
      if (!location) {
        throw new ApiError("NOT_FOUND", "Location not found");
      }

      Object.assign(location, locationData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async DeleteLocation(businessInfoId: string, locationId: string) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.locations.pull(locationId);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // ⭐ REVIEWS METHODS
  // ============================================

  public async AddReview(businessInfoId: string, reviewData: any) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }
  
      if (!businessInfo.reviews) {
        businessInfo.set('reviews', {
          items: [reviewData]
        });
      } else {
        businessInfo.reviews.items.push(reviewData);
      }
  
      await businessInfo.save();
      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdateReviewsSettings(
    businessInfoId: string,
    settings: {
      hero_image?: string;
      main_title_ar?: string;
      main_title_en?: string;
    }
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }
  
      if (!businessInfo.reviews) {
        businessInfo.set('reviews', {
          hero_image: '',
          main_title_ar: '',
          main_title_en: '',
          items: []
        });
      }
  
      if (settings.hero_image !== undefined) {
        businessInfo.reviews.hero_image = settings.hero_image;
      }
      if (settings.main_title_ar !== undefined) {
        businessInfo.reviews.main_title_ar = settings.main_title_ar;
      }
      if (settings.main_title_en !== undefined) {
        businessInfo.reviews.main_title_en = settings.main_title_en;
      }
  
      businessInfo.markModified('reviews');
      await businessInfo.save();
      
      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async UpdateReview(
    businessInfoId: string,
    reviewId: string,
    reviewData: any
  ) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      const review = businessInfo.reviews?.items.id(reviewId);
      if (!review) {
        throw new ApiError("NOT_FOUND", "Review not found");
      }

      Object.assign(review, reviewData);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  public async DeleteReview(businessInfoId: string, reviewId: string) {
    try {
      const businessInfo = await BusinessInfoModel.findById(businessInfoId);
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      businessInfo.reviews?.items.pull(reviewId);
      await businessInfo.save();

      return businessInfo;
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // 📊 EXPORT/IMPORT METHODS
  // ============================================

  public async ExportBusinessInfo() {
    try {
      const businessInfo = await BusinessInfoModel.findOne({});
      if (!businessInfo) {
        throw new ApiError("NOT_FOUND", "Business info not found");
      }

      return {
        basicInfo: businessInfo,
        aboutSections: businessInfo.about?.sections || [],
        members: businessInfo.members || [],
        partners: businessInfo.partners || [],
        locations: businessInfo.locations || [],
        reviews: businessInfo.reviews?.items || [],
      };
    } catch (error) {
      throw error;
    }
  }

  public async ImportAboutSections(
    businessInfoId: string,
    sectionsData: any[]
  ) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };
  
    const businessInfo = await BusinessInfoModel.findById(businessInfoId);
    if (!businessInfo) {
      throw new ApiError("NOT_FOUND", "Business info not found");
    }
  
    if (!businessInfo.about) {
      businessInfo.set('about', { sections: [] });
    }
  
    for (const row of sectionsData) {
      try {
        const sectionData = {
          hero_image: row.hero_image,
          title_ar: row.title_ar,
          title_en: row.title_en,
          description_ar: row.description_ar,
          description_en: row.description_en,
          display_order: Number(row.display_order) || 0,
        };
  
        const existingIndex = businessInfo.about!.sections.findIndex(
          (s: any) => s.title_en === sectionData.title_en
        );
  
        if (existingIndex !== -1) {
          Object.assign(
            businessInfo.about!.sections[existingIndex],
            sectionData
          );
          results.updated.push(sectionData);
        } else {
          businessInfo.about!.sections.push(sectionData as any);
          results.success.push(sectionData);
        }
      } catch (error: any) {
        results.failed.push({
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }
  
    await businessInfo.save();
    return results;
  }
  
  public async ImportReviews(businessInfoId: string, reviewsData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };
  
    const businessInfo = await BusinessInfoModel.findById(businessInfoId);
    if (!businessInfo) {
      throw new ApiError("NOT_FOUND", "Business info not found");
    }
  
    if (!businessInfo.reviews) {
      businessInfo.set('reviews', { items: [] });
    }
  
    for (const row of reviewsData) {
      try {
        const reviewData = {
          client_name_ar: row.client_name_ar,
          client_name_en: row.client_name_en,
          client_position_ar: row.client_position_ar,
          client_position_en: row.client_position_en,
          client_company_ar: row.client_company_ar,
          client_company_en: row.client_company_en,
          client_image: row.client_image,
          review_ar: row.review_ar,
          review_en: row.review_en,
          rating: Number(row.rating) || 5,
          is_featured:
            row.is_featured === true ||
            row.is_featured === "true" ||
            row.is_featured === 1,
          display_order: Number(row.display_order) || 0,
        };
  
        const existingReviewIndex = businessInfo.reviews!.items.findIndex(
          (r: any) =>
            r.client_name_en === reviewData.client_name_en &&
            r.client_company_en === reviewData.client_company_en
        );
  
        if (existingReviewIndex !== -1) {
          Object.assign(
            businessInfo.reviews!.items[existingReviewIndex],
            reviewData
          );
          results.updated.push(reviewData);
        } else {
          businessInfo.reviews!.items.push(reviewData as any);
          results.success.push(reviewData);
        }
      } catch (error: any) {
        results.failed.push({
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }
  
    await businessInfo.save();
    return results;
  }

  public async ImportMembers(businessInfoId: string, membersData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };

    const businessInfo = await BusinessInfoModel.findById(businessInfoId);
    if (!businessInfo) {
      throw new ApiError("NOT_FOUND", "Business info not found");
    }

    for (const row of membersData) {
      try {
        const memberData = {
          name_ar: row.name_ar,
          name_en: row.name_en,
          position_ar: row.position_ar,
          position_en: row.position_en,
          bio_ar: row.bio_ar,
          bio_en: row.bio_en,
          image: row.image,
          email: row.email,
          phone: row.phone,
          linkedin: row.linkedin,
          is_leadership:
            row.is_leadership === true ||
            row.is_leadership === "true" ||
            row.is_leadership === 1,
          display_order: Number(row.display_order) || 0,
        };

        const existingMemberIndex = businessInfo.members.findIndex(
          (m: any) => m.email === memberData.email
        );

        if (existingMemberIndex !== -1) {
          Object.assign(businessInfo.members[existingMemberIndex], memberData);
          results.updated.push(memberData);
        } else {
          businessInfo.members.push(memberData as any);
          results.success.push(memberData);
        }
      } catch (error: any) {
        results.failed.push({
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }

    await businessInfo.save();
    return results;
  }

  public async ImportPartners(businessInfoId: string, partnersData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };

    const businessInfo = await BusinessInfoModel.findById(businessInfoId);
    if (!businessInfo) {
      throw new ApiError("NOT_FOUND", "Business info not found");
    }

    for (const row of partnersData) {
      try {
        const partnerData = {
          name_ar: row.name_ar,
          name_en: row.name_en,
          description_ar: row.description_ar,
          description_en: row.description_en,
          image: row.image,
          website: row.website,
          display_order: Number(row.display_order) || 0,
        };

        const existingPartnerIndex = businessInfo.partners.findIndex(
          (p: any) =>
            p.name_en === partnerData.name_en ||
            (p.website && p.website === partnerData.website)
        );

        if (existingPartnerIndex !== -1) {
          Object.assign(
            businessInfo.partners[existingPartnerIndex],
            partnerData
          );
          results.updated.push(partnerData);
        } else {
          businessInfo.partners.push(partnerData as any);
          results.success.push(partnerData);
        }
      } catch (error: any) {
        results.failed.push({
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }

    await businessInfo.save();
    return results;
  }

  public async ImportLocations(businessInfoId: string, locationsData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };

    const businessInfo = await BusinessInfoModel.findById(businessInfoId);
    if (!businessInfo) {
      throw new ApiError("NOT_FOUND", "Business info not found");
    }

    for (const row of locationsData) {
      try {
        const locationData = {
          country_ar: row.country_ar,
          country_en: row.country_en,
          city_ar: row.city_ar,
          city_en: row.city_en,
          address_ar: row.address_ar,
          address_en: row.address_en,
          phone: row.phone,
          email: row.email,
          map_url: row.map_url,
        };

        const existingLocationIndex = businessInfo.locations.findIndex(
          (l: any) =>
            l.city_en === locationData.city_en &&
            l.country_en === locationData.country_en
        );

        if (existingLocationIndex !== -1) {
          Object.assign(
            businessInfo.locations[existingLocationIndex],
            locationData
          );
          results.updated.push(locationData);
        } else {
          businessInfo.locations.push(locationData as any);
          results.success.push(locationData);
        }
      } catch (error: any) {
        results.failed.push({
          data: row,
          error: error.message || "Unknown error occurred",
        });
      }
    }

    await businessInfo.save();
    return results;
  }
}