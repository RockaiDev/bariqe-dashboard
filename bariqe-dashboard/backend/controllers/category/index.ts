import { Request, Response, NextFunction } from "express";
import CategoryService from "../../services/mongodb/category";
import BaseApi from "../../utils/BaseApi";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../../utils/errors/ApiError";
import CloudinaryService from "../../services/cloudinary/CloudinaryService";

// 📂 Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =
      file.fieldname === "categoryImage" ? "uploads/temp/" : "uploads/";
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
    if (file.fieldname === "categoryImage") {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      }
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const categoryService = new CategoryService();

export default class CategoryController extends BaseApi {
  /**
   * Helper method to get existing category image safely
   */
  private getExistingCategoryImage(category: any): string | null {
    if (!category) return null;
    if (category.categoryImage) return category.categoryImage;
    if (category.data?.categoryImage) return category.data.categoryImage;
    if (category._doc?.categoryImage) return category._doc.categoryImage;
    return null;
  }

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

  // 🟢 Get all categories
  public async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.GetCategories(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get one category
  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const includeSubCategories = req.query.includeSubCategories !== "false";
      const data = await categoryService.GetOneCategory(
        req.params.id,
        includeSubCategories
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get active categories only
  public async getActiveCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const includeSubCategories = req.query.includeSubCategories !== "false";
      const data = await categoryService.GetActiveCategories(
        includeSubCategories
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get category statistics
  public async getCategoryStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await categoryService.GetCategoryStats();
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Add category (with image support)
  public async addCategory(req: Request, res: Response, next: NextFunction) {
    try {
      let categoryData = { ...req.body };

      // Handle image upload if present
      if (req.file) {
        const publicId = `category_${
          categoryData.categoryNameEn || Date.now()
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;
        categoryData.categoryPublicId = publicId;
        this.cleanupFile(req.file.path);
      }

      // Parse subCategories if provided as string
      if (typeof categoryData.subCategories === "string") {
        try {
          categoryData.subCategories = JSON.parse(categoryData.subCategories);
        } catch {
          categoryData.subCategories = [];
        }
      }

      const data = await categoryService.AddCategory(categoryData);
      super.send(res, {
        message: "Category added successfully",
        data: data,
      });
    } catch (err) {
      if (req.file) this.cleanupFile(req.file.path);
      next(err);
    }
  }

  // 🟢 Add category with base64 image
  public async addCategoryWithBase64(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let categoryData = { ...req.body };

      if (categoryData.categoryImageBase64) {
        const publicId = `category_${
          categoryData.categoryNameEn || Date.now()
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          categoryData.categoryImageBase64,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;
        categoryData.categoryPublicId = publicId;
        delete categoryData.categoryImageBase64;
      }

      const data = await categoryService.AddCategory(categoryData);
      super.send(res, {
        message: "Category added successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Edit category (with image support)
  public async editCategory(req: Request, res: Response, next: NextFunction) {
    try {
      let categoryData = { ...req.body };
      const existingCategory = await categoryService.GetOneCategory(
        req.params.id
      );
      const oldImageUrl = this.getExistingCategoryImage(existingCategory);

      if (req.file) {
        const publicId = `category_${
          categoryData.categoryNameEn || req.params.id
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;
        categoryData.categoryPublicId = publicId;
        this.cleanupFile(req.file.path);

        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      // Parse subCategories if provided as string
      if (typeof categoryData.subCategories === "string") {
        try {
          categoryData.subCategories = JSON.parse(categoryData.subCategories);
        } catch {
          // Don't update subCategories if parsing fails
          delete categoryData.subCategories;
        }
      }

      const data = await categoryService.EditOneCategory(
        req.params.id,
        categoryData
      );
      super.send(res, {
        message: "Category updated successfully",
        data: data,
      });
    } catch (err) {
      if (req.file) this.cleanupFile(req.file.path);
      next(err);
    }
  }

  // 🟢 Edit category with base64 image
  public async editCategoryWithBase64(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let categoryData = { ...req.body };
      const existingCategory = await categoryService.GetOneCategory(
        req.params.id
      );
      const oldImageUrl = this.getExistingCategoryImage(existingCategory);

      if (categoryData.categoryImageBase64) {
        const publicId = `category_${
          categoryData.categoryNameEn || req.params.id
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          categoryData.categoryImageBase64,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;
        categoryData.categoryPublicId = publicId;
        delete categoryData.categoryImageBase64;

        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      const data = await categoryService.EditOneCategory(
        req.params.id,
        categoryData
      );
      super.send(res, {
        message: "Category updated successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Change category image only
  public async changeCategoryImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categoryId = req.params.id;
      const existingCategory = await categoryService.GetOneCategory(categoryId);
      const oldImageUrl = this.getExistingCategoryImage(existingCategory);
      let newImageUrl: string | null = null;
      let publicId: string;

      if (req.file) {
        publicId = `category_${categoryId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "categories",
          publicId
        );
        this.cleanupFile(req.file.path);
      } else if (req.body.categoryImageBase64) {
        publicId = `category_${categoryId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadImageFromBase64(
          req.body.categoryImageBase64,
          "categories",
          publicId
        );
      } else {
        return res.status(400).json({ message: "No image provided" });
      }

      const data = await categoryService.EditOneCategory(categoryId, {
        categoryImage: newImageUrl,
        categoryPublicId: publicId,
      });

      if (oldImageUrl && data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Category image updated successfully",
        data: data,
        newImageUrl: newImageUrl,
      });
    } catch (err) {
      if (req.file) this.cleanupFile(req.file.path);
      next(err);
    }
  }

  // 🟢 Remove category image only
  public async removeCategoryImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categoryId = req.params.id;
      const existingCategory = await categoryService.GetOneCategory(categoryId);
      const oldImageUrl = this.getExistingCategoryImage(existingCategory);

      if (!oldImageUrl) {
        return res
          .status(400)
          .json({ message: "Category has no image to remove" });
      }

      const data = await categoryService.EditOneCategory(categoryId, {
        categoryImage: null,
        categoryPublicId: null,
      });

      if (data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Category image removed successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Delete category (with image cleanup)
  public async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const existingCategory = await categoryService.GetOneCategory(
        req.params.id
      );
      const imageUrl = this.getExistingCategoryImage(existingCategory);

      const result = await categoryService.DeleteOneCategory(req.params.id);

      if (imageUrl && result) {
        await CloudinaryService.deleteImage(imageUrl);
      }

      super.send(res, {
        message: "Category deleted successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 SubCategory Management
  public async addSubCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const data = await categoryService.AddSubCategory(categoryId, req.body);
      super.send(res, {
        message: "Sub-category added successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  public async editSubCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryId, subCategoryId } = req.params;
      const data = await categoryService.EditSubCategory(
        categoryId,
        subCategoryId,
        req.body
      );
      super.send(res, {
        message: "Sub-category updated successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteSubCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryId, subCategoryId } = req.params;
      const data = await categoryService.DeleteSubCategory(
        categoryId,
        subCategoryId
      );
      super.send(res, {
        message: "Sub-category deleted successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get subcategories for a specific category
  public async getSubCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryId } = req.params;
      const category = await categoryService.GetOneCategory(categoryId, true);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      super.send(res, {
        categoryId: category._id,
        categoryName: {
          en: category.categoryNameEn,
          ar: category.categoryNameAr,
        },
        subCategories: category.subCategories || [],
        count: category.subCategories?.length || 0,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Toggle category status (Active/Inactive)
  public async toggleCategoryStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categoryId = req.params.id;
      const existingCategory = await categoryService.GetOneCategory(categoryId);

      const newStatus = !existingCategory.categoryStatus;
      const data = await categoryService.EditOneCategory(categoryId, {
        categoryStatus: newStatus,
      });

      super.send(res, {
        message: `Category ${
          newStatus ? "activated" : "deactivated"
        } successfully`,
        data: data,
        newStatus: newStatus,
      });
    } catch (err) {
      next(err);
    }
  }


public async exportCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.ExportCategories(req.query);
    if (!categories?.length) {
      return res.status(404).json({ message: "No categories found to export" });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bariqe El Tamioz";
    workbook.created = new Date();

    // ✅ Categories Sheet - قابل للإمبورت مباشرة
    const categoriesSheet = workbook.addWorksheet("Categories", {
      properties: { tabColor: { argb: "0000FF" } },
    });

    categoriesSheet.columns = [
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 30 },
      { header: "Category Name (English)", key: "categoryNameEn", width: 30 },
      { header: "Description (Arabic)", key: "categoryDescriptionAr", width: 50 },
      { header: "Description (English)", key: "categoryDescriptionEn", width: 50 },
      { header: "Status", key: "categoryStatus", width: 15 },
      { header: "Image URL (Optional)", key: "categoryImage", width: 50 },
      { header: "SubCategories Data (JSON)", key: "subCategoriesData", width: 80 },
    ];

    // Style header
    categoriesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    categoriesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    categoriesSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // ✅ إضافة البيانات القابلة للإمبورت
    categories.forEach((cat) => {
      const row = categoriesSheet.addRow({
        categoryNameAr: cat.categoryNameAr,
        categoryNameEn: cat.categoryNameEn,
        categoryDescriptionAr: cat.categoryDescriptionAr,
        categoryDescriptionEn: cat.categoryDescriptionEn,
        categoryStatus: cat.categoryStatus,
        categoryImage: cat.categoryImage,
        subCategoriesData: cat.subCategoriesData,
      });
      
      const statusCell = row.getCell(5);
      statusCell.font = {
        color: { argb: cat.categoryStatus === "Active" ? "FF008000" : "FFFF0000" },
      };
    });

    // ✅ SubCategories Details Sheet - للعرض والتعديل
    const subCategoriesSheet = workbook.addWorksheet("SubCategories Details", {
      properties: { tabColor: { argb: "00FF00" } },
    });

    subCategoriesSheet.columns = [
      { header: "Category Name (EN)", key: "categoryNameEn", width: 30 },
      { header: "Category Name (AR)", key: "categoryNameAr", width: 30 },
      { header: "SubCategory Name (EN)", key: "subCategoryNameEn", width: 30 },
      { header: "SubCategory Name (AR)", key: "subCategoryNameAr", width: 30 },
      { header: "SubCategory Status", key: "subCategoryStatus", width: 20 },
    ];

    // Style header for subcategories
    subCategoriesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    subCategoriesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF70AD47" },
    };
    subCategoriesSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // ✅ Add subcategories data for viewing/editing
    categories.forEach((cat) => {
      if (cat.subCategoriesData && cat.subCategoriesData !== "[]") {
        try {
          const subCategories = JSON.parse(cat.subCategoriesData);
          subCategories.forEach((sub: any) => {
            subCategoriesSheet.addRow({
              categoryNameEn: cat.categoryNameEn,
              categoryNameAr: cat.categoryNameAr,
              subCategoryNameEn: sub.nameEn,
              subCategoryNameAr: sub.nameAr,
              subCategoryStatus: sub.status ? "Active" : "Inactive"
            });
          });
        } catch (error) {
          console.error("Error parsing subcategories for category:", cat.categoryNameEn);
        }
      }
    });

    // ✅ Instructions Sheet - تعليمات محدثة
    const instructionsSheet = workbook.addWorksheet("Instructions", {
      properties: { tabColor: { argb: "FFFF0000" } },
    });

    instructionsSheet.columns = [
      { header: "Import/Export Instructions", key: "instruction", width: 100 },
    ];

    instructionsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    instructionsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF0000" },
    };



const instructionsList = [
  "📋 How to use this exported file:",
  "",
  "🔄 FOR IMPORT:",
  "1. Modify data in 'Categories' sheet only",
  "2. Do NOT change column headers",
  "3. Keep the same format for SubCategories Data (JSON)",
  "4. Save and import the file",
  "",
  "📝 EDITING GUIDELINES:",
  "Categories Sheet:",
  "   ✅ You can edit all fields",
  "   ✅ Status must be 'Active' or 'Inactive'",
  "   ✅ Descriptions are optional",
  "   ✅ Image URL is optional",
  "   ✅ SubCategories Data: Use JSON format",
  "",
  "SubCategories Details Sheet:",
  "   ℹ️  This sheet is for viewing only",
  "   ℹ️  To edit subcategories, modify JSON in Categories sheet",
  "",
  "🔧 SubCategories JSON Format:",
  "   Empty: []",
  "   One: [{\"nameEn\": \"Electronics\", \"nameAr\": \"إلكترونيات\", \"status\": true}]",
  "   Multiple: [{\"nameEn\": \"Sub1\", \"nameAr\": \"فرعي1\", \"status\": true}, {\"nameEn\": \"Sub2\", \"nameAr\": \"فرعي2\", \"status\": false}]",
  "",
  "⚠️ IMPORTANT NOTES:",
  "   • Existing categories will be UPDATED, not duplicated",
  "   • Category names must be unique",
  "   • Both Arabic and English names are required",
  "   • ✅ SubCategories will be MERGED (added to existing)", // ✅ Updated
  "   • ✅ Existing subcategories will NOT be deleted", // ✅ New
  "   • ✅ Duplicate subcategory names will be skipped", // ✅ New
  "   • Invalid JSON will be ignored",
  "",
  // ... باقي التعليمات
];

    instructionsList.forEach((instruction, index) => {
      if (index > 0) {
        const row = instructionsSheet.addRow([instruction]);
        if (instruction.includes("📋") || instruction.includes("🔄") || instruction.includes("📝") || instruction.includes("🔧") || instruction.includes("⚠️") || instruction.includes("🚀")) {
          row.font = { bold: true, color: { argb: "FF0066CC" } };
        }
      }
    });

    // ✅ Summary Sheet
    const summarySheet = workbook.addWorksheet("Export Summary");
    summarySheet.columns = [
      { header: "Export Information", key: "info", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    summaryHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    };

    const exportDate = new Date().toLocaleDateString();
    const exportTime = new Date().toLocaleTimeString();
    const totalSubCategories = categories.reduce((sum, cat) => {
      try {
        const subs = JSON.parse(cat.subCategoriesData || "[]");
        return sum + subs.length;
      } catch {
        return sum;
      }
    }, 0);

    summarySheet.addRow({ info: "Export Date", value: exportDate });
    summarySheet.addRow({ info: "Export Time", value: exportTime });
    summarySheet.addRow({ info: "Total Categories", value: categories.length });
    summarySheet.addRow({ info: "Total SubCategories", value: totalSubCategories });
    summarySheet.addRow({ info: "Active Categories", value: categories.filter(c => c.categoryStatus === "Active").length });
    summarySheet.addRow({ info: "Inactive Categories", value: categories.filter(c => c.categoryStatus === "Inactive").length });
    summarySheet.addRow({ info: "Categories with Images", value: categories.filter(c => c.categoryImage).length });
    summarySheet.addRow({ info: "Categories with SubCategories", value: categories.filter(c => {
      try {
        const subs = JSON.parse(c.subCategoriesData || "[]");
        return subs.length > 0;
      } catch {
        return false;
      }
    }).length });

    // Add borders to all sheets
    [categoriesSheet, subCategoriesSheet, instructionsSheet, summarySheet].forEach(sheet => {
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
      `attachment; filename=categories_export_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
  } catch (err) {
    next(err);
  }
}
  // 🟢 Download import template - محدث لدعم SubCategories
// 🟢 Download import template - محدث مع تعليمات أفضل
public async downloadTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bariqe El Tamioz";
    workbook.created = new Date();

    // ✅ Categories Template Sheet
    const categoriesSheet = workbook.addWorksheet("Categories");
    
    categoriesSheet.columns = [
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 30 },
      { header: "Category Name (English)", key: "categoryNameEn", width: 30 },
      { header: "Description (Arabic)", key: "categoryDescriptionAr", width: 50 },
      { header: "Description (English)", key: "categoryDescriptionEn", width: 50 },
      { header: "Status", key: "categoryStatus", width: 15 },
      { header: "Image URL (Optional)", key: "categoryImage", width: 50 },
      { header: "SubCategories Data (JSON)", key: "subCategoriesData", width: 80 },
    ];
    
    categoriesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    categoriesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    categoriesSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // ✅ Sample data with comprehensive examples
    categoriesSheet.addRow({
      categoryNameAr: "الكيماويات",
      categoryNameEn: "Chemicals",
      categoryDescriptionAr: "فئة المواد الكيميائية المختلفة",
      categoryDescriptionEn: "Various chemical materials category",
      categoryStatus: "Active",
      categoryImage: "https://example.com/chemicals.jpg",
      subCategoriesData: JSON.stringify([
        { nameEn: "Organic Chemicals", nameAr: "كيماويات عضوية", status: true },
        { nameEn: "Inorganic Chemicals", nameAr: "كيماويات غير عضوية", status: true }
      ]),
    });

    categoriesSheet.addRow({
      categoryNameAr: "المعدات",
      categoryNameEn: "Equipment",
      categoryDescriptionAr: "معدات المختبرات والمصانع",
      categoryDescriptionEn: "Laboratory and factory equipment",
      categoryStatus: "Active",
      categoryImage: "",
      subCategoriesData: JSON.stringify([
        { nameEn: "Lab Equipment", nameAr: "معدات مختبر", status: true },
        { nameEn: "Safety Equipment", nameAr: "معدات السلامة", status: false }
      ]),
    });

    categoriesSheet.addRow({
      categoryNameAr: "مواد خام",
      categoryNameEn: "Raw Materials",
      categoryDescriptionAr: "المواد الخام الأساسية",
      categoryDescriptionEn: "Basic raw materials",
      categoryStatus: "Inactive",
      categoryImage: "",
      subCategoriesData: "[]",
    });

    // ✅ Add data validation
    for (let i = 2; i <= 4; i++) {
      categoriesSheet.getCell(`E${i}`).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Active,Inactive"'],
      };
    }

    // ✅ SubCategories Examples Sheet
    const examplesSheet = workbook.addWorksheet("SubCategories Examples");
    
    examplesSheet.columns = [
      { header: "Example Type", key: "type", width: 20 },
      { header: "JSON Format", key: "json", width: 80 },
      { header: "Description", key: "description", width: 40 },
    ];
    
    examplesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    examplesSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF70AD47" },
    };

    examplesSheet.addRow({
      type: "No SubCategories",
      json: "[]",
      description: "Category without any subcategories"
    });

    examplesSheet.addRow({
      type: "Single SubCategory",
      json: '[{"nameEn": "Electronics", "nameAr": "إلكترونيات", "status": true}]',
      description: "Category with one active subcategory"
    });

    examplesSheet.addRow({
      type: "Multiple SubCategories",
      json: '[{"nameEn": "Laptops", "nameAr": "أجهزة لابتوب", "status": true}, {"nameEn": "Phones", "nameAr": "هواتف", "status": false}]',
      description: "Category with multiple subcategories (active/inactive)"
    });

    examplesSheet.addRow({
      type: "Complex Example",
      json: '[{"nameEn": "High-End Laptops", "nameAr": "أجهزة لابتوب متقدمة", "status": true}, {"nameEn": "Budget Laptops", "nameAr": "أجهزة لابتوب اقتصادية", "status": true}, {"nameEn": "Gaming Laptops", "nameAr": "أجهزة لابتوب للألعاب", "status": false}]',
      description: "Category with many detailed subcategories"
    });

    // ✅ Comprehensive Instructions Sheet
    const instructionsSheet = workbook.addWorksheet("Instructions");
    instructionsSheet.columns = [
      { header: "Import Instructions & Guidelines", key: "instruction", width: 100 },
    ];
    
    instructionsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    instructionsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF0000" },
    };



const detailedInstructions = [
  "📋 COMPLETE IMPORT GUIDE FOR CATEGORIES",
  "",
  "🎯 QUICK START:",
  "1. Fill data in 'Categories' sheet",
  "2. Save this file",
  "3. Import through the system",
  "",
  "📝 REQUIRED FIELDS (Categories Sheet):",
  "   ✅ Category Name (Arabic) - مطلوب",
  "   ✅ Category Name (English) - Required",
  "   ✅ Status: 'Active' or 'Inactive' only",
  "",
  "📝 OPTIONAL FIELDS:",
  "   • Description (Arabic) - recommended",
  "   • Description (English) - recommended", 
  "   • Image URL - leave empty if no image",
  "   • SubCategories Data - see examples below",
  "",
  "🔧 SUBCATEGORIES JSON FORMAT:",
  "   Empty (no subcategories): []",
  "   Single: [{\"nameEn\": \"Name\", \"nameAr\": \"اسم\", \"status\": true}]",
  "   Multiple: [{\"nameEn\": \"Name1\", \"nameAr\": \"اسم1\", \"status\": true}, {\"nameEn\": \"Name2\", \"nameAr\": \"اسم2\", \"status\": false}]",
  "",
  "⚙️ SUBCATEGORY RULES:",
  "   • Both nameEn and nameAr are required for each subcategory",
  "   • status is optional (defaults to true if not specified)",
  "   • Must be valid JSON format",
  "   • Check 'SubCategories Examples' sheet for more examples",
  "",
  "🔄 IMPORT BEHAVIOR:",
  "   • New categories will be CREATED",
  "   • Existing categories will be UPDATED (not duplicated)",
  "   • Categories with no changes will be SKIPPED",
  "   • ✅ SubCategories will be MERGED (added to existing, duplicates skipped)", // ✅ Updated line
  "   • Existing subcategories will NOT be deleted", // ✅ New line
  "",
  "⚠️ IMPORTANT WARNINGS:",
  "   • Category names must be unique",
  "   • Do NOT change column headers",
  "   • Status must be exactly 'Active' or 'Inactive'",
  "   • Invalid JSON in SubCategories will be ignored",
  "   • Duplicate subcategory names will be skipped (not added)", // ✅ New line
  "   • Large images may slow down the system",
  "",
  "🔄 SUBCATEGORIES MERGE LOGIC:", // ✅ New section
  "   • If subcategory name (EN or AR) already exists → SKIP",
  "   • If subcategory name is new → ADD to existing list",
  "   • Existing subcategories are preserved",
  "   • No subcategories are deleted during import",
  "",
  // ... باقي التعليمات
];

    detailedInstructions.forEach((instruction, index) => {
      if (index > 0) {
        const row = instructionsSheet.addRow([instruction]);
        if (instruction.includes("📋") || instruction.includes("🎯") || instruction.includes("📝") || instruction.includes("🔧") || instruction.includes("⚙️") || instruction.includes("🔄") || instruction.includes("⚠️") || instruction.includes("🐛") || instruction.includes("💡") || instruction.includes("📞")) {
          row.font = { bold: true, color: { argb: "FF0066CC" } };
        }
      }
    });

    // Add borders to all sheets
    [categoriesSheet, examplesSheet, instructionsSheet].forEach(sheet => {
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
      "attachment; filename=categories_import_template.xlsx"
    );

    await workbook.xlsx.write(res);
  } catch (err) {
    next(err);
  }
}
  // 🟢 Import categories - محدث لدعم SubCategories
  public async importCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const uploadSingle = upload.single("file");

    uploadSingle(req, res, async (err) => {
      if (err) return next(err);

      if (!req.file) {
        return next(new ApiError("BAD_REQUEST", "No file uploaded"));
      }

      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);
        const sheet = workbook.getWorksheet("Categories");
        if (!sheet)
          throw new ApiError("BAD_REQUEST", "Missing 'Categories' sheet");

        const categoriesData: any[] = [];
        const errors: any[] = [];

        sheet.eachRow((row, rowNum) => {
          if (rowNum === 1) return; // skip header

          try {
            const categoryNameAr = String(row.getCell(1).value || "").trim();
            const categoryNameEn = String(row.getCell(2).value || "").trim();
            const categoryDescriptionAr = String(
              row.getCell(3).value || ""
            ).trim();
            const categoryDescriptionEn = String(
              row.getCell(4).value || ""
            ).trim();
            const status = String(row.getCell(5).value || "Active").trim();
            const categoryImage = String(row.getCell(6).value || "").trim();
            const subCategoriesData = String(
              row.getCell(7).value || "[]"
            ).trim(); // ✅ SubCategories

            if (!categoryNameAr && !categoryNameEn) return;

            if (!categoryNameAr || !categoryNameEn) {
              throw new Error(`Missing required fields (Arabic/English names)`);
            }

            if (!["Active", "Inactive"].includes(status)) {
              throw new Error(`Invalid status: ${status}`);
            }

            // ✅ Validate SubCategories JSON
            if (subCategoriesData && subCategoriesData !== "[]") {
              try {
                const parsedSubCategories = JSON.parse(subCategoriesData);
                if (!Array.isArray(parsedSubCategories)) {
                  throw new Error("SubCategories data must be an array");
                }

                // Validate each subcategory
                for (const sub of parsedSubCategories) {
                  if (!sub.nameEn || !sub.nameAr) {
                    throw new Error(
                      "Each subcategory must have nameEn and nameAr"
                    );
                  }
                }
              } catch (parseError) {
                throw new Error(
                  `Invalid SubCategories JSON format: ${parseError.message}`
                );
              }
            }

            categoriesData.push({
              categoryNameAr,
              categoryNameEn,
              categoryDescriptionAr,
              categoryDescriptionEn,
              categoryStatus: status,
              categoryImage: categoryImage || null,
              subCategoriesData, // ✅ Pass SubCategories data
            });
          } catch (error: any) {
            errors.push({
              row: rowNum,
              categoryName: String(
                row.getCell(2).value || row.getCell(1).value || "UNKNOWN"
              ),
              error: error.message,
            });
          }
        });

        if (!categoriesData.length && errors.length > 0) {
          fs.unlinkSync(req.file.path);
          return next(
            new ApiError(
              "BAD_REQUEST",
              `All rows failed validation. First error: ${errors[0].error}`
            )
          );
        }

        const results :any = await categoryService.ImportCategories(categoriesData);

        // ✅ Include validation errors in response
        if (errors.length > 0) {
          results.validationErrors = errors;
        }

        fs.unlinkSync(req.file.path);
        super.send(res, {
          message: "Import completed successfully",
          results,
        });
      } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        next(error);
      }
    });
  }
  // 🟢 Bulk delete categories
  public async bulkDeleteCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return next(
          new ApiError("BAD_REQUEST", "Category IDs array is required")
        );
      }

      const results = {
        deleted: [] as string[],
        failed: [] as any[],
      };

      for (const categoryId of categoryIds) {
        try {
          const existingCategory = await categoryService.GetOneCategory(
            categoryId
          );
          const imageUrl = this.getExistingCategoryImage(existingCategory);

          await categoryService.DeleteOneCategory(categoryId);

          if (imageUrl) {
            await CloudinaryService.deleteImage(imageUrl);
          }

          results.deleted.push(categoryId);
        } catch (error: any) {
          results.failed.push({
            categoryId,
            error: error.message,
          });
        }
      }

      super.send(res, {
        message: `Bulk delete completed. ${results.deleted.length} deleted, ${results.failed.length} failed.`,
        results,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Multer middleware for category image upload
  public uploadCategoryImage = upload.single("categoryImage");
}
