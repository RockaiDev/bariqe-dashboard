// src/controllers/category/index.ts
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
    const uploadDir = file.fieldname === "categoryImage" ? "uploads/temp/" : "uploads/";
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
    // Check if it's Excel file
    if (file.fieldname === "file") {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xls") {
        return cb(new Error("Only Excel files are allowed"));
      }
    }
    // Check if it's image file for category
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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
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
      const data = await categoryService.GetOneCategory(req.params.id);
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
        const publicId = `category_${categoryData.categoryNameEn || Date.now()}_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;

        // Clean up temporary file
        this.cleanupFile(req.file.path);
      }

      const data = await categoryService.AddCategory(categoryData);
      super.send(res, data);
    } catch (err) {
      // Clean up uploaded file in case of error
      if (req.file) {
        this.cleanupFile(req.file.path);
      }
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

      // Handle base64 image upload if present
      if (categoryData.categoryImageBase64) {
        const publicId = `category_${categoryData.categoryNameEn || Date.now()}_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          categoryData.categoryImageBase64,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;

        // Remove base64 data from request
        delete categoryData.categoryImageBase64;
      }

      const data = await categoryService.AddCategory(categoryData);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Edit category (with image support)
  public async editCategory(req: Request, res: Response, next: NextFunction) {
    try {
      let categoryData = { ...req.body };

      // Get existing category to check for old image
      const existingCategory = await categoryService.GetOneCategory(req.params.id);
      const oldImageUrl = this.getExistingCategoryImage(existingCategory);

      // Handle image upload if present
      if (req.file) {
        const publicId = `category_${categoryData.categoryNameEn || req.params.id}_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;

        // Clean up temporary file
        this.cleanupFile(req.file.path);

        // Delete old image if it exists and upload was successful
        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      const data = await categoryService.EditOneCategory(
        req.params.id,
        categoryData
      );
      super.send(res, data);
    } catch (err) {
      // Clean up uploaded file in case of error
      if (req.file) {
        this.cleanupFile(req.file.path);
      }
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

      // Get existing category to check for old image
      const existingCategory = await categoryService.GetOneCategory(req.params.id);
      const oldImageUrl = this.getExistingCategoryImage(existingCategory);

      // Handle base64 image upload if present
      if (categoryData.categoryImageBase64) {
        const publicId = `category_${categoryData.categoryNameEn || req.params.id}_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          categoryData.categoryImageBase64,
          "categories",
          publicId
        );
        categoryData.categoryImage = imageUrl;

        // Remove base64 data from request
        delete categoryData.categoryImageBase64;

        // Delete old image if it exists and upload was successful
        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      const data = await categoryService.EditOneCategory(
        req.params.id,
        categoryData
      );
      super.send(res, data);
    } catch (err) {
      console.error("Edit category with base64 error:", err);
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

      // Get existing category
      const existingCategory = await categoryService.GetOneCategory(categoryId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const oldImageUrl = this.getExistingCategoryImage(existingCategory);
      let newImageUrl: string | null = null;

      // Handle different upload types
      if (req.file) {
        // File upload
        const publicId = `category_${categoryId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "categories",
          publicId
        );
        this.cleanupFile(req.file.path);
      } else if (req.body.categoryImageBase64) {
        // Base64 upload
        const publicId = `category_${categoryId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadImageFromBase64(
          req.body.categoryImageBase64,
          "categories",
          publicId
        );
      } else {
        return res.status(400).json({ message: "No image provided" });
      }

      // Update category with new image
      const data = await categoryService.EditOneCategory(categoryId, {
        categoryImage: newImageUrl,
      });

      // Delete old image if update was successful
      if (oldImageUrl && data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Category image updated successfully",
        data: data,
        newImageUrl: newImageUrl,
      });
    } catch (err) {
      // Clean up uploaded file in case of error
      if (req.file) {
        this.cleanupFile(req.file.path);
      }
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

      // Get existing category
      const existingCategory = await categoryService.GetOneCategory(categoryId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const oldImageUrl = this.getExistingCategoryImage(existingCategory);

      if (!oldImageUrl) {
        return res
          .status(400)
          .json({ message: "Category has no image to remove" });
      }

      // Remove image from category
      const data = await categoryService.EditOneCategory(categoryId, {
        categoryImage: null,
      });

      // Delete image from Cloudinary if update was successful
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
      // Get existing category to delete image
      const existingCategory = await categoryService.GetOneCategory(req.params.id);
      const imageUrl = this.getExistingCategoryImage(existingCategory);

      const result = await categoryService.DeleteOneCategory(req.params.id);

      // Delete image from Cloudinary if category deletion was successful
      if (imageUrl && result) {
        await CloudinaryService.deleteImage(imageUrl);
      }

      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export categories to Excel - محدث للحقول الجديدة
  public async exportCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const categories = await categoryService.ExportCategories(req.query);
      if (!categories?.length) {
        return res
          .status(404)
          .json({ message: "No categories found to export" });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet("Categories", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // تحديث الأعمدة للحقول الجديدة
      sheet.columns = [
        { header: "Category Name (Arabic)", key: "categoryNameAr", width: 30 },
        { header: "Category Name (English)", key: "categoryNameEn", width: 30 },
        { header: "Description (Arabic)", key: "categoryDescriptionAr", width: 50 },
        { header: "Description (English)", key: "categoryDescriptionEn", width: 50 },
        { header: "Status", key: "categoryStatus", width: 15 },
        { header: "Image URL", key: "categoryImage", width: 50 },
        { header: "Created At", key: "createdAt", width: 20 },
        { header: "Updated At", key: "updatedAt", width: 20 },
      ];

      // Style header
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      categories.forEach((cat) => {
        const row = sheet.addRow(cat);
        const statusCell = row.getCell("categoryStatus");
        statusCell.font = {
          color: { argb: cat.categoryStatus === "Active" ? "FF008000" : "FFFF0000" },
        };
      });

      sheet.eachRow((row) =>
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        })
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=categories_export_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Download import template - محدث للحقول الجديدة
  public async downloadTemplate( 
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Categories");
      
      // تحديث الأعمدة للحقول الجديدة
      sheet.columns = [
        { header: "Category Name (Arabic)", key: "categoryNameAr", width: 30 },
        { header: "Category Name (English)", key: "categoryNameEn", width: 30 },
        { header: "Description (Arabic)", key: "categoryDescriptionAr", width: 50 },
        { header: "Description (English)", key: "categoryDescriptionEn", width: 50 },
        { header: "Status", key: "categoryStatus", width: 15 },
        { header: "Image URL (Optional)", key: "categoryImage", width: 50 },
      ];
      
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      // تحديث البيانات التجريبية
      sheet.addRow({
        categoryNameAr: "فئة تجريبية",
        categoryNameEn: "Sample Category",
        categoryDescriptionAr: "وصف الفئة التجريبية",
        categoryDescriptionEn: "Example category description",
        categoryStatus: "Active",
        categoryImage: "https://example.com/image.jpg (optional)",
      });
      sheet.addRow({
        categoryNameAr: "فئة أخرى",
        categoryNameEn: "Another Category",
        categoryDescriptionAr: "وصف فئة أخرى",
        categoryDescriptionEn: "Another sample category",
        categoryStatus: "Inactive",
        categoryImage: "",
      });

      // Add data validation for Status
      sheet.getCell("E2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Active,Inactive"'],
      };
      sheet.getCell("E3").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Active,Inactive"'],
      };

      const instructions = workbook.addWorksheet("Instructions");
      instructions.addRow(["How to use this template:"]);
      instructions.addRow([
        "1. Do not modify headers.",
      ]);
      instructions.addRow([
        "2. Fill required fields (Arabic and English names/descriptions).",
      ]);
      instructions.addRow([
        "3. Status must be Active/Inactive.",
      ]);
      instructions.addRow([
        "4. Image URL is optional - leave empty if no image.",
      ]);
      instructions.addRow([
        "5. All Arabic and English fields are required.",
      ]);

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

  // 🟢 Import categories - محدث للحقول الجديدة
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
        if (!sheet) throw new ApiError("BAD_REQUEST", "Missing 'Categories' sheet");

        const categoriesData: any[] = [];
        sheet.eachRow((row, rowNum) => {
          if (rowNum === 1) return; // skip header
          
          // تحديث قراءة البيانات للحقول الجديدة
          const categoryNameAr = String(row.getCell(1).value || "").trim();
          const categoryNameEn = String(row.getCell(2).value || "").trim();
          const categoryDescriptionAr = String(row.getCell(3).value || "").trim();
          const categoryDescriptionEn = String(row.getCell(4).value || "").trim();
          const status = String(row.getCell(5).value || "Active").trim();
          const categoryImage = String(row.getCell(6).value || "").trim();

          // تخطي الصفوف الفارغة
          if (!categoryNameAr && !categoryNameEn && !categoryDescriptionAr && !categoryDescriptionEn) return;
          
          // التحقق من البيانات المطلوبة
          if (!categoryNameAr || !categoryNameEn || !categoryDescriptionAr || !categoryDescriptionEn) {
            throw new ApiError("BAD_REQUEST", `Row ${rowNum}: Missing required fields (Arabic/English names or descriptions)`);
          }
          
          if (!["Active", "Inactive"].includes(status)) {
            throw new ApiError("BAD_REQUEST", `Row ${rowNum}: Invalid status`);
          }

          categoriesData.push({
            categoryNameAr,
            categoryNameEn,
            categoryDescriptionAr,
            categoryDescriptionEn,
            categoryStatus: status,
            categoryImage: categoryImage || null,
          });
        });

        if (!categoriesData.length) {
          throw new ApiError("BAD_REQUEST", "No valid category data found");
        }

        const results = await categoryService.ImportCategories(categoriesData);

        fs.unlinkSync(req.file.path); // cleanup file
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
}