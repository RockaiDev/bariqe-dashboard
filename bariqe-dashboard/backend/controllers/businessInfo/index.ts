import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import BusinessInfoService from "../../services/mongodb/businessInfo/index";
import CloudinaryService from "../../services/cloudinary/CloudinaryService";

// Multer File type definition to avoid namespace issues
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/temp/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "file") {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xls") {
        return cb(new Error("Only Excel files are allowed"));
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const businessInfoService = new BusinessInfoService();

export default class BusinessInfoController extends BaseApi {
  /**
   * Helper method to clean up uploaded file
   */
  private cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Cleaned up temp file:", filePath);
      }
    } catch (error) {
      console.error("Error cleaning up file:", error);
    }
  }

  // ============================================
  // 🟢 GENERAL ENDPOINTS
  // ============================================

  public async getBusinessInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data: any = await businessInfoService.GetBusinessInfo();
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getBusinessInfoById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.GetBusinessInfoById(
        req.params.id
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async upsertBusinessInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.UpsertBusinessInfo(
        req.body,
        req.params.id
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // 🎨 UPLOAD MEDIA
  // ============================================

  public async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const businessInfoId = req.params.id;
      const files = req.files as { [fieldname: string]: MulterFile[] };

      const updateData: any = {};

      // Logo
      const logoFile = files && files["logo"] ? files["logo"][0] : undefined;
      if (logoFile) {
        const publicId = `business/logo_${Date.now()}`;
        const url = await CloudinaryService.uploadFromPath(
          logoFile.path,
          "business",
          publicId
        );
        updateData.logo = url;
        this.cleanupFile(logoFile.path);
      }

      // About Hero Image
      const aboutHeroFile =
        files && files["aboutHeroImage"]
          ? files["aboutHeroImage"][0]
          : undefined;
      if (aboutHeroFile) {
        const publicId = `business/about_hero_${Date.now()}`;
        const url = await CloudinaryService.uploadFromPath(
          aboutHeroFile.path,
          "business",
          publicId
        );
        updateData["about.hero_image"] = url;
        this.cleanupFile(aboutHeroFile.path);
      }

      // Reviews Hero Image
      const reviewsHeroFile =
        files && files["reviewsHeroImage"]
          ? files["reviewsHeroImage"][0]
          : undefined;
      if (reviewsHeroFile) {
        const publicId = `business/reviews_hero_${Date.now()}`;
        const url = await CloudinaryService.uploadFromPath(
          reviewsHeroFile.path,
          "business",
          publicId
        );
        updateData["reviews.hero_image"] = url;
        this.cleanupFile(reviewsHeroFile.path);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No media files provided" });
      }

      const updated = await businessInfoService.UpsertBusinessInfo(
        updateData,
        businessInfoId
      );

      super.send(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as MulterFile | undefined;
      const folder = (req.body && (req.body.folder as string)) || "business";
      const prefix = (req.body && (req.body.prefix as string)) || "media";

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const publicId = `${prefix}_${Date.now()}`;
      const url = await CloudinaryService.uploadFromPath(
        file.path,
        folder,
        publicId
      );
      this.cleanupFile(file.path);

      super.send(res, { url });
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // 📖 ABOUT SECTIONS ENDPOINTS
  // ============================================

  public async addAboutSection(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.AddAboutSection(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updateAboutSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const businessInfoId = req.params.id;
      const {
        hero_image,
        main_title_ar,
        main_title_en,
        main_description_ar,
        main_description_en
      } = req.body;

      const data = await businessInfoService.UpdateAboutSettings(
        businessInfoId,
        {
          hero_image,
          main_title_ar,
          main_title_en,
          main_description_ar,
          main_description_en,
        }
      );

      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updateAboutSection(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.UpdateAboutSection(
        req.params.id,
        req.params.sectionId,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deleteAboutSection(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.DeleteAboutSection(
        req.params.id,
        req.params.sectionId
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // 👥 MEMBERS ENDPOINTS
  // ============================================

  public async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.AddMember(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.UpdateMember(
        req.params.id,
        req.params.memberId,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deleteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.DeleteMember(
        req.params.id,
        req.params.memberId
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // 🤝 PARTNERS ENDPOINTS
  // ============================================

  public async addPartner(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.AddPartner(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updatePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.UpdatePartner(
        req.params.id,
        req.params.partnerId,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deletePartner(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.DeletePartner(
        req.params.id,
        req.params.partnerId
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // 📍 LOCATIONS ENDPOINTS
  // ============================================

  public async addLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.AddLocation(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updateLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.UpdateLocation(
        req.params.id,
        req.params.locationId,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deleteLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.DeleteLocation(
        req.params.id,
        req.params.locationId
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // ⭐ REVIEWS ENDPOINTS
  // ============================================

  public async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.AddReview(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updateReviewsSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const businessInfoId = req.params.id;
      const { hero_image, main_title_ar, main_title_en } = req.body;

      const data = await businessInfoService.UpdateReviewsSettings(
        businessInfoId,
        {
          hero_image,
          main_title_ar,
          main_title_en,
        }
      );

      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.UpdateReview(
        req.params.id,
        req.params.reviewId,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await businessInfoService.DeleteReview(
        req.params.id,
        req.params.reviewId
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ============================================
  // 📊 EXPORT ENDPOINT
  // ============================================

  public async exportBusinessInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await businessInfoService.ExportBusinessInfo();

      if (!data) {
        return res
          .status(404)
          .json({ message: "No business info found to export" });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Business System";
      workbook.created = new Date();

      // 📄 Basic Info Sheet
      const basicSheet = workbook.addWorksheet("Basic Info");
      basicSheet.columns = [
        { header: "Field", key: "field", width: 30 },
        { header: "Value (AR)", key: "value_ar", width: 50 },
        { header: "Value (EN)", key: "value_en", width: 50 },
      ];

      basicSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      basicSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      const basicInfo = data.basicInfo;
      basicSheet.addRow({
        field: "Title",
        value_ar: basicInfo.title_ar,
        value_en: basicInfo.title_en,
      });
      basicSheet.addRow({
        field: "Description",
        value_ar: basicInfo.description_ar,
        value_en: basicInfo.description_en,
      });
      basicSheet.addRow({
        field: "Address",
        value_ar: basicInfo.address_ar,
        value_en: basicInfo.address_en,
      });
      basicSheet.addRow({
        field: "Email",
        value_ar: basicInfo.email,
        value_en: basicInfo.email,
      });
      basicSheet.addRow({
        field: "Phone",
        value_ar: basicInfo.phone,
        value_en: basicInfo.phone,
      });
      basicSheet.addRow({
        field: "WhatsApp",
        value_ar: basicInfo.whatsapp,
        value_en: basicInfo.whatsapp,
      });
      basicSheet.addRow({
        field: "Website",
        value_ar: basicInfo.facebook,
        value_en: basicInfo.facebook,
      });

      // 📖 About Sections Sheet
      const aboutSheet = workbook.addWorksheet("About Sections");
      aboutSheet.columns = [
        { header: "Hero Image URL", key: "hero_image", width: 40 },
        { header: "Title (AR)", key: "title_ar", width: 30 },
        { header: "Title (EN)", key: "title_en", width: 30 },
        { header: "Description (AR)", key: "description_ar", width: 50 },
        { header: "Description (EN)", key: "description_en", width: 50 },
        { header: "Display Order", key: "display_order", width: 15 },
      ];

      aboutSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      aboutSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9966FF" },
      };

      data.aboutSections.forEach((section: any) => {
        aboutSheet.addRow({
          hero_image: section.hero_image,
          title_ar: section.title_ar,
          title_en: section.title_en,
          description_ar: section.description_ar,
          description_en: section.description_en,
          display_order: section.display_order,
        });
      });

      // 👥 Members Sheet
      const membersSheet = workbook.addWorksheet("Members");
      membersSheet.columns = [
        { header: "Name (AR)", key: "name_ar", width: 25 },
        { header: "Name (EN)", key: "name_en", width: 25 },
        { header: "Position (AR)", key: "position_ar", width: 25 },
        { header: "Position (EN)", key: "position_en", width: 25 },
        { header: "Bio (AR)", key: "bio_ar", width: 40 },
        { header: "Bio (EN)", key: "bio_en", width: 40 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "LinkedIn", key: "linkedin", width: 30 },
        { header: "Is Leadership", key: "is_leadership", width: 15 },
        { header: "Display Order", key: "display_order", width: 15 },
        { header: "Image URL", key: "image", width: 40 },
      ];

      membersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      membersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };

      data.members.forEach((member: any) => {
        membersSheet.addRow({
          name_ar: member.name_ar,
          name_en: member.name_en,
          position_ar: member.position_ar,
          position_en: member.position_en,
          bio_ar: member.bio_ar,
          bio_en: member.bio_en,
          email: member.email,
          phone: member.phone,
          linkedin: member.linkedin,
          is_leadership: member.is_leadership ? "Yes" : "No",
          display_order: member.display_order,
          image: member.image,
        });
      });

      // 🤝 Partners Sheet
      const partnersSheet = workbook.addWorksheet("Partners");
      partnersSheet.columns = [
        { header: "Name (AR)", key: "name_ar", width: 25 },
        { header: "Name (EN)", key: "name_en", width: 25 },
        { header: "Description (AR)", key: "description_ar", width: 40 },
        { header: "Description (EN)", key: "description_en", width: 40 },
        { header: "facebook", key: "facebook", width: 30 },
        { header: "Display Order", key: "display_order", width: 15 },
        { header: "Image URL", key: "image", width: 40 },
      ];

      partnersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      partnersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" },
      };

      data.partners.forEach((partner: any) => {
        partnersSheet.addRow({
          name_ar: partner.name_ar,
          name_en: partner.name_en,
          description_ar: partner.description_ar,
          description_en: partner.description_en,
          website: partner.website,
          display_order: partner.display_order,
          image: partner.image,
        });
      });

      // 📍 Locations Sheet
      const locationsSheet = workbook.addWorksheet("Locations");
      locationsSheet.columns = [
        { header: "Country (AR)", key: "country_ar", width: 20 },
        { header: "Country (EN)", key: "country_en", width: 20 },
        { header: "City (AR)", key: "city_ar", width: 20 },
        { header: "City (EN)", key: "city_en", width: 20 },
        { header: "Address (AR)", key: "address_ar", width: 40 },
        { header: "Address (EN)", key: "address_en", width: 40 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Map URL", key: "map_url", width: 40 },
      ];

      locationsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      locationsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF5B9BD5" },
      };

      data.locations.forEach((location: any) => {
        locationsSheet.addRow({
          country_ar: location.country_ar,
          country_en: location.country_en,
          city_ar: location.city_ar,
          city_en: location.city_en,
          address_ar: location.address_ar,
          address_en: location.address_en,
          phone: location.phone,
          email: location.email,
          map_url: location.map_url,
        });
      });

      // ⭐ Reviews Sheet
      const reviewsSheet = workbook.addWorksheet("Reviews");
      reviewsSheet.columns = [
        { header: "Client Name (AR)", key: "client_name_ar", width: 25 },
        { header: "Client Name (EN)", key: "client_name_en", width: 25 },
        { header: "Position (AR)", key: "client_position_ar", width: 25 },
        { header: "Position (EN)", key: "client_position_en", width: 25 },
        { header: "Company (AR)", key: "client_company_ar", width: 25 },
        { header: "Company (EN)", key: "client_company_en", width: 25 },
        { header: "Review (AR)", key: "review_ar", width: 50 },
        { header: "Review (EN)", key: "review_en", width: 50 },
        { header: "Rating", key: "rating", width: 10 },
        { header: "Is Featured", key: "is_featured", width: 15 },
        { header: "Display Order", key: "display_order", width: 15 },
        { header: "Client Image URL", key: "client_image", width: 40 },
      ];

      reviewsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      reviewsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFCC00" },
      };

      data.reviews.forEach((review: any) => {
        reviewsSheet.addRow({
          client_name_ar: review.client_name_ar,
          client_name_en: review.client_name_en,
          client_position_ar: review.client_position_ar,
          client_position_en: review.client_position_en,
          client_company_ar: review.client_company_ar,
          client_company_en: review.client_company_en,
          review_ar: review.review_ar,
          review_en: review.review_en,
          rating: review.rating,
          is_featured: review.is_featured ? "Yes" : "No",
          display_order: review.display_order,
          client_image: review.client_image,
        });
      });

      // Add borders to all sheets
      [
        basicSheet,
        aboutSheet,
        membersSheet,
        partnersSheet,
        locationsSheet,
        reviewsSheet,
      ].forEach((sheet) => {
        sheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=business_info_export_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Export error:", err);
      next(err);
    }
  }

  // ============================================
  // 📥 DOWNLOAD TEMPLATE
  // ============================================

  public async downloadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Business System";

      // 📖 About Sections Template
      const aboutSheet = workbook.addWorksheet("About Sections");
      aboutSheet.columns = [
        { header: "Hero Image URL", key: "hero_image", width: 40 },
        { header: "Title (AR)", key: "title_ar", width: 30 },
        { header: "Title (EN)", key: "title_en", width: 30 },
        { header: "Description (AR)", key: "description_ar", width: 50 },
        { header: "Description (EN)", key: "description_en", width: 50 },
        { header: "Display Order", key: "display_order", width: 15 },
      ];

      aboutSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      aboutSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9966FF" },
      };

      aboutSheet.addRow({
        hero_image: "https://example.com/vision.jpg",
        title_ar: "رؤيتنا",
        title_en: "Our Vision",
        description_ar: "نسعى لأن نكون...",
        description_en: "We aspire to be...",
        display_order: 1,
      });

      // 👥 Members Template
      const membersSheet = workbook.addWorksheet("Members");
      membersSheet.columns = [
        { header: "Name (AR)", key: "name_ar", width: 25 },
        { header: "Name (EN)", key: "name_en", width: 25 },
        { header: "Position (AR)", key: "position_ar", width: 25 },
        { header: "Position (EN)", key: "position_en", width: 25 },
        { header: "Bio (AR)", key: "bio_ar", width: 40 },
        { header: "Bio (EN)", key: "bio_en", width: 40 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "LinkedIn", key: "linkedin", width: 30 },
        { header: "Is Leadership", key: "is_leadership", width: 15 },
        { header: "Display Order", key: "display_order", width: 15 },
        { header: "Image URL", key: "image", width: 40 },
      ];

      membersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      membersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };

      membersSheet.addRow({
        name_ar: "أحمد محمد",
        name_en: "Ahmed Mohamed",
        position_ar: "المدير التنفيذي",
        position_en: "CEO",
        bio_ar: "خبرة 15 عام في المجال",
        bio_en: "15 years of experience",
        email: "ahmed@company.com",
        phone: "+201234567890",
        linkedin: "https://linkedin.com/in/ahmed",
        is_leadership: "Yes",
        display_order: 1,
        image: "https://example.com/image.jpg",
      });

      // 🤝 Partners Template
      const partnersSheet = workbook.addWorksheet("Partners");
      partnersSheet.columns = [
        { header: "Name (AR)", key: "name_ar", width: 25 },
        { header: "Name (EN)", key: "name_en", width: 25 },
        { header: "Description (AR)", key: "description_ar", width: 40 },
        { header: "Description (EN)", key: "description_en", width: 40 },
        { header: "Website", key: "website", width: 30 },
        { header: "Display Order", key: "display_order", width: 15 },
        { header: "Image URL", key: "image", width: 40 },
      ];

      partnersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      partnersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" },
      };

      partnersSheet.addRow({
        name_ar: "شريك تجاري",
        name_en: "Business Partner",
        description_ar: "وصف الشريك",
        description_en: "Partner description",
        website: "https://partner.com",
        display_order: 1,
        image: "https://example.com/logo.jpg",
      });

      // 📍 Locations Template
      const locationsSheet = workbook.addWorksheet("Locations");
      locationsSheet.columns = [
        { header: "Country (AR)", key: "country_ar", width: 20 },
        { header: "Country (EN)", key: "country_en", width: 20 },
        { header: "City (AR)", key: "city_ar", width: 20 },
        { header: "City (EN)", key: "city_en", width: 20 },
        { header: "Address (AR)", key: "address_ar", width: 40 },
        { header: "Address (EN)", key: "address_en", width: 40 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Map URL", key: "map_url", width: 40 },
      ];

      locationsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      locationsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF5B9BD5" },
      };

      locationsSheet.addRow({
        country_ar: "مصر",
        country_en: "Egypt",
        city_ar: "القاهرة",
        city_en: "Cairo",
        address_ar: "شارع التحرير",
        address_en: "Tahrir Street",
        phone: "+20212345678",
        email: "cairo@company.com",
        map_url: "https://maps.google.com/...",
      });

      // ⭐ Reviews Template
      const reviewsSheet = workbook.addWorksheet("Reviews");
      reviewsSheet.columns = [
        { header: "Client Name (AR)", key: "client_name_ar", width: 25 },
        { header: "Client Name (EN)", key: "client_name_en", width: 25 },
        { header: "Position (AR)", key: "client_position_ar", width: 25 },
        { header: "Position (EN)", key: "client_position_en", width: 25 },
        { header: "Company (AR)", key: "client_company_ar", width: 25 },
        { header: "Company (EN)", key: "client_company_en", width: 25 },
        { header: "Review (AR)", key: "review_ar", width: 50 },
        { header: "Review (EN)", key: "review_en", width: 50 },
        { header: "Rating", key: "rating", width: 10 },
        { header: "Is Featured", key: "is_featured", width: 15 },
        { header: "Display Order", key: "display_order", width: 15 },
        { header: "Client Image URL", key: "client_image", width: 40 },
      ];

      reviewsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      reviewsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFCC00" },
      };

      reviewsSheet.addRow({
        client_name_ar: "محمد علي",
        client_name_en: "Mohamed Ali",
        client_position_ar: "مدير عام",
        client_position_en: "General Manager",
        client_company_ar: "شركة النجاح",
        client_company_en: "Success Co.",
        review_ar: "تجربة رائعة مع الشركة",
        review_en: "Great experience with the company",
        rating: 5,
        is_featured: "Yes",
        display_order: 1,
        client_image: "https://example.com/client.jpg",
      });

      // 📝 Instructions Sheet
      const instructionsSheet = workbook.addWorksheet("Instructions");
      instructionsSheet.columns = [
        { header: "Instructions", key: "instructions", width: 100 },
      ];

      instructionsSheet.getRow(1).font = {
        bold: true,
        size: 14,
        color: { argb: "FFFFFFFF" },
      };
      instructionsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" },
      };

      const instructions = [
        "How to use this template:",
        "",
        "ABOUT SECTIONS SHEET:",
        "- Fill in different about sections (Vision, Mission, Values, etc.)",
        "- Title (EN) should be unique",
        "",
        "MEMBERS SHEET:",
        "- Fill in team member details",
        "- Is Leadership: Enter 'Yes' or 'No'",
        "- Display Order: Number for sorting (lower = higher priority)",
        "- Email should be unique for each member",
        "",
        "PARTNERS SHEET:",
        "- Fill in business partner details",
        "- Name (EN) or Website should be unique",
        "",
        "LOCATIONS SHEET:",
        "- Fill in office/branch locations",
        "- Combination of City (EN) + Country (EN) should be unique",
        "",
        "REVIEWS SHEET:",
        "- Fill in client testimonials and reviews",
        "- Rating: Number from 1 to 5",
        "- Is Featured: Enter 'Yes' or 'No' (featured reviews show on homepage)",
        "- Combination of Client Name (EN) + Company (EN) should be unique",
        "",
        "GENERAL NOTES:",
        "- Delete sample data before importing",
        "- Required fields: Name (AR), Name (EN) for all sheets",
        "- For Reviews: Review (AR), Review (EN) are also required",
        "- Maximum file size: 10MB",
        "- Supported formats: .xlsx, .xls",
        "- All images should be uploaded to Cloudinary first",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          const row = instructionsSheet.addRow([text]);
          if (text.endsWith(":")) {
            row.font = { bold: true, size: 12 };
          }
        }
      });

      // Add borders
      [
        aboutSheet,
        membersSheet,
        partnersSheet,
        locationsSheet,
        reviewsSheet,
      ].forEach((sheet) => {
        sheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=business_info_import_template.xlsx"
      );

      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // ============================================
  // 📥 IMPORT ENDPOINT
  // ============================================

  public async importBusinessInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const uploadSingle = upload.single("file");

    uploadSingle(req, res, async (err) => {
      if (err) return next(err);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        let businessInfoId = req.params.id;
        if (!businessInfoId) {
          const existing = await businessInfoService.GetBusinessInfo();
          if (existing) {
            businessInfoId = (existing as any)._id.toString();
          } else {
            throw new Error(
              "No business info found. Please create one first."
            );
          }
        }

        const results: any = {
          aboutSections: { success: [], updated: [], failed: [] },
          members: { success: [], updated: [], failed: [] },
          partners: { success: [], updated: [], failed: [] },
          locations: { success: [], updated: [], failed: [] },
          reviews: { success: [], updated: [], failed: [] },
        };

        // 📖 Import About Sections
        const aboutSheet = workbook.getWorksheet("About Sections");
        if (aboutSheet) {
          const aboutData: any[] = [];
          aboutSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const title_en = String(row.getCell(3).value || "").trim();
              if (title_en) {
                aboutData.push({
                  hero_image: String(row.getCell(1).value || "").trim(),
                  title_ar: String(row.getCell(2).value || "").trim(),
                  title_en,
                  description_ar: String(row.getCell(4).value || "").trim(),
                  description_en: String(row.getCell(5).value || "").trim(),
                  display_order: Number(row.getCell(6).value) || 0,
                });
              }
            }
          });

          if (aboutData.length > 0) {
            results.aboutSections =
              await businessInfoService.ImportAboutSections(
                businessInfoId,
                aboutData
              );
          }
        }

        // 👥 Import Members
        const membersSheet = workbook.getWorksheet("Members");
        if (membersSheet) {
          const membersData: any[] = [];
          membersSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const name_en = String(row.getCell(2).value || "").trim();
              if (name_en) {
                membersData.push({
                  name_ar: String(row.getCell(1).value || "").trim(),
                  name_en,
                  position_ar: String(row.getCell(3).value || "").trim(),
                  position_en: String(row.getCell(4).value || "").trim(),
                  bio_ar: String(row.getCell(5).value || "").trim(),
                  bio_en: String(row.getCell(6).value || "").trim(),
                  email: String(row.getCell(7).value || "").trim(),
                  phone: String(row.getCell(8).value || "").trim(),
                  linkedin: String(row.getCell(9).value || "").trim(),
                  is_leadership:
                    String(row.getCell(10).value || "").toLowerCase() ===
                    "yes",
                  display_order: Number(row.getCell(11).value) || 0,
                  image: String(row.getCell(12).value || "").trim(),
                });
              }
            }
          });

          if (membersData.length > 0) {
            results.members = await businessInfoService.ImportMembers(
              businessInfoId,
              membersData
            );
          }
        }

        // 🤝 Import Partners
        const partnersSheet = workbook.getWorksheet("Partners");
        if (partnersSheet) {
          const partnersData: any[] = [];
          partnersSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const name_en = String(row.getCell(2).value || "").trim();
              if (name_en) {
                partnersData.push({
                  name_ar: String(row.getCell(1).value || "").trim(),
                  name_en,
                  description_ar: String(row.getCell(3).value || "").trim(),
                  description_en: String(row.getCell(4).value || "").trim(),
                  website: String(row.getCell(5).value || "").trim(),
                  display_order: Number(row.getCell(6).value) || 0,
                  image: String(row.getCell(7).value || "").trim(),
                });
              }
            }
          });

          if (partnersData.length > 0) {
            results.partners = await businessInfoService.ImportPartners(
              businessInfoId,
              partnersData
            );
          }
        }

        // 📍 Import Locations
        const locationsSheet = workbook.getWorksheet("Locations");
        if (locationsSheet) {
          const locationsData: any[] = [];
          locationsSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const city_en = String(row.getCell(4).value || "").trim();
              if (city_en) {
                locationsData.push({
                  country_ar: String(row.getCell(1).value || "").trim(),
                  country_en: String(row.getCell(2).value || "").trim(),
                  city_ar: String(row.getCell(3).value || "").trim(),
                  city_en,
                  address_ar: String(row.getCell(5).value || "").trim(),
                  address_en: String(row.getCell(6).value || "").trim(),
                  phone: String(row.getCell(7).value || "").trim(),
                  email: String(row.getCell(8).value || "").trim(),
                  map_url: String(row.getCell(9).value || "").trim(),
                });
              }
            }
          });

          if (locationsData.length > 0) {
            results.locations = await businessInfoService.ImportLocations(
              businessInfoId,
              locationsData
            );
          }
        }

        // ⭐ Import Reviews
        const reviewsSheet = workbook.getWorksheet("Reviews");
        if (reviewsSheet) {
          const reviewsData: any[] = [];
          reviewsSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const client_name_en = String(row.getCell(2).value || "").trim();
              const review_en = String(row.getCell(8).value || "").trim();
              if (client_name_en && review_en) {
                reviewsData.push({
                  client_name_ar: String(row.getCell(1).value || "").trim(),
                  client_name_en,
                  client_position_ar: String(row.getCell(3).value || "").trim(),
                  client_position_en: String(row.getCell(4).value || "").trim(),
                  client_company_ar: String(row.getCell(5).value || "").trim(),
                  client_company_en: String(row.getCell(6).value || "").trim(),
                  review_ar: String(row.getCell(7).value || "").trim(),
                  review_en,
                  rating: Number(row.getCell(9).value) || 5,
                  is_featured:
                    String(row.getCell(10).value || "").toLowerCase() ===
                    "yes",
                  display_order: Number(row.getCell(11).value) || 0,
                  client_image: String(row.getCell(12).value || "").trim(),
                });
              }
            }
          });

          if (reviewsData.length > 0) {
            results.reviews = await businessInfoService.ImportReviews(
              businessInfoId,
              reviewsData
            );
          }
        }

        this.cleanupFile(req.file.path);

        const summary = {
          aboutSections: {
            total:
              results.aboutSections.success.length +
              results.aboutSections.updated.length +
              results.aboutSections.failed.length,
            success: results.aboutSections.success.length,
            updated: results.aboutSections.updated.length,
            failed: results.aboutSections.failed.length,
          },
          members: {
            total:
              results.members.success.length +
              results.members.updated.length +
              results.members.failed.length,
            success: results.members.success.length,
            updated: results.members.updated.length,
            failed: results.members.failed.length,
          },
          partners: {
            total:
              results.partners.success.length +
              results.partners.updated.length +
              results.partners.failed.length,
            success: results.partners.success.length,
            updated: results.partners.updated.length,
            failed: results.partners.failed.length,
          },
          locations: {
            total:
              results.locations.success.length +
              results.locations.updated.length +
              results.locations.failed.length,
            success: results.locations.success.length,
            updated: results.locations.updated.length,
            failed: results.locations.failed.length,
          },
          reviews: {
            total:
              results.reviews.success.length +
              results.reviews.updated.length +
              results.reviews.failed.length,
            success: results.reviews.success.length,
            updated: results.reviews.updated.length,
            failed: results.reviews.failed.length,
          },
        };

        super.send(res, {
          message: "Import completed",
          results,
          summary,
        });
      } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) {
          this.cleanupFile(req.file.path);
        }
        console.error("Import error:", error);
        next(new Error(error.message || "Error processing import file"));
      }
    });
  }
}