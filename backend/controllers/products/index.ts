import { Request, Response, NextFunction } from "express";
import ProductService from "../../services/mongodb/product";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import CloudinaryService from "../../services/cloudinary/CloudinaryService";

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
    // Check if it's Excel file
    if (file.fieldname === "file") {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xls") {
        return cb(new Error("Only Excel files are allowed"));
      }
    }
    // Check if it's image file
    if (file.fieldname === "productImage") {
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

const productService = new ProductService();

export default class ProductController extends BaseApi {
  /**
   * Helper method to get existing product image safely
   */
  private getExistingProductImage(product: any): string | null {
    if (!product) return null;

    // Try different possible structures
    if (product.productImage) return product.productImage;
    if (product.data?.productImage) return product.data.productImage;
    if (product._doc?.productImage) return product._doc.productImage;

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

  // 🟢 Get all products
  public async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await productService.GetProducts(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get one product
  public async getOneProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await productService.GetOneProduct(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Add product (with image support)
  public async addProduct(req: Request, res: Response, next: NextFunction) {
    try {
      let productData = { ...req.body };

      // Parse discountTiers if it's a JSON string
      if (productData.discountTiers && typeof productData.discountTiers === 'string') {
        try {
          productData.discountTiers = JSON.parse(productData.discountTiers);
        } catch (error) {
          console.error("Error parsing discountTiers:", error);
        }
      }

      // Handle image upload if present
      if (req.file) {
        const publicId = `product_${
          productData.productCode || Date.now()
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "products",
          publicId
        );
        productData.productImage = imageUrl;

        // Clean up temporary file
        this.cleanupFile(req.file.path);
      }

      const data = await productService.AddProduct(productData);
      super.send(res, data);
    } catch (err) {
      // Clean up uploaded file in case of error
      if (req.file) {
        this.cleanupFile(req.file.path);
      }
      next(err);
    }
  }

  // 🟢 Add product with base64 image
  public async addProductWithBase64(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let productData = { ...req.body };

      // Parse discountTiers if it's a JSON string
      if (productData.discountTiers && typeof productData.discountTiers === 'string') {
        try {
          productData.discountTiers = JSON.parse(productData.discountTiers);
        } catch (error) {
          console.error("Error parsing discountTiers:", error);
        }
      }

      // Handle base64 image upload if present
      if (productData.productImageBase64) {
        const publicId = `product_${
          productData.productCode || Date.now()
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          productData.productImageBase64,
          "products",
          publicId
        );
        productData.productImage = imageUrl;

        // Remove base64 data from request
        delete productData.productImageBase64;
      }

      const data = await productService.AddProduct(productData);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Edit product (with image support)
  public async editProduct(req: Request, res: Response, next: NextFunction) {
    try {
      let productData = { ...req.body };

      // Parse discountTiers if it's a JSON string
      if (productData.discountTiers && typeof productData.discountTiers === 'string') {
        try {
          productData.discountTiers = JSON.parse(productData.discountTiers);
        } catch (error) {
          console.error("Error parsing discountTiers:", error);
        }
      }

      // Get existing product to check for old image
      const existingProduct = await productService.GetOneProduct(req.params.id);
      const oldImageUrl = this.getExistingProductImage(existingProduct);

      // Handle image upload if present
      if (req.file) {
        const publicId = `product_${
          productData.productCode || req.params.id
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "products",
          publicId
        );
        productData.productImage = imageUrl;

        // Clean up temporary file
        this.cleanupFile(req.file.path);

        // Delete old image if it exists and upload was successful
        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      const data = await productService.EditOneProduct(
        req.params.id,
        productData
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

  // 🟢 Edit product with base64 image
  public async editProductWithBase64(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let productData = { ...req.body };

      // Parse discountTiers if it's a JSON string
      if (productData.discountTiers && typeof productData.discountTiers === 'string') {
        try {
          productData.discountTiers = JSON.parse(productData.discountTiers);
        } catch (error) {
          console.error("Error parsing discountTiers:", error);
        }
      }

      // Get existing product to check for old image
      const existingProduct = await productService.GetOneProduct(req.params.id);
      const oldImageUrl = this.getExistingProductImage(existingProduct);

      // Handle base64 image upload if present
      if (productData.productImageBase64) {
        const publicId = `product_${
          productData.productCode || req.params.id
        }_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          productData.productImageBase64,
          "products",
          publicId
        );
        productData.productImage = imageUrl;

        // Remove base64 data from request
        delete productData.productImageBase64;

        // Delete old image if it exists and upload was successful
        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      const data = await productService.EditOneProduct(
        req.params.id,
        productData
      );
      super.send(res, data);
    } catch (err) {
      console.error("Edit with base64 error:", err);
      next(err);
    }
  }

  // 🟢 Change product image only
  public async changeProductImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const productId = req.params.id;

      // Get existing product
      const existingProduct = await productService.GetOneProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const oldImageUrl = this.getExistingProductImage(existingProduct);
      let newImageUrl: string | null = null;

      // Handle different upload types
      if (req.file) {
        // File upload
        const publicId = `product_${productId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "products",
          publicId
        );
        this.cleanupFile(req.file.path);
      } else if (req.body.productImageBase64) {
        // Base64 upload
        const publicId = `product_${productId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadImageFromBase64(
          req.body.productImageBase64,
          "products",
          publicId
        );
      } else {
        return res.status(400).json({ message: "No image provided" });
      }

      // Update product with new image
      const data = await productService.EditOneProduct(productId, {
        productImage: newImageUrl,
      });

      // Delete old image if update was successful
      if (oldImageUrl && data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Product image updated successfully",
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

  // 🟢 Remove product image only
  public async removeProductImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const productId = req.params.id;

      // Get existing product
      const existingProduct = await productService.GetOneProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const oldImageUrl = this.getExistingProductImage(existingProduct);

      if (!oldImageUrl) {
        return res
          .status(400)
          .json({ message: "Product has no image to remove" });
      }

      // Remove image from product
      const data = await productService.EditOneProduct(productId, {
        productImage: null,
      });

      // Delete image from Cloudinary if update was successful
      if (data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Product image removed successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Delete product (with image cleanup)
  public async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      // Get existing product to delete image
      const existingProduct = await productService.GetOneProduct(req.params.id);
      const imageUrl = this.getExistingProductImage(existingProduct);

      const data = await productService.DeleteOneProduct(req.params.id);

      // Delete image from Cloudinary if product deletion was successful
      if (imageUrl && data) {
        await CloudinaryService.deleteImage(imageUrl);
      }

      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export products to Excel - UPDATED FOR NEW CATEGORY STRUCTURE
// في products controller
    public async exportProducts(req: Request, res: Response) {
  try {
    const productService = new ProductService();
    
    // تمرير جميع query parameters للـ service
    const exportData = await productService.ExportProducts(req.query);
    
    // إنشاء Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');
    
    // إضافة headers
    worksheet.columns = [
      { header: 'Product Code', key: 'productCode', width: 15 },
      { header: 'Product Name (AR)', key: 'productNameAr', width: 25 },
      { header: 'Product Name (EN)', key: 'productNameEn', width: 25 },
      { header: 'Description (AR)', key: 'productDescriptionAr', width: 30 },
      { header: 'Description (EN)', key: 'productDescriptionEn', width: 30 },
      { header: 'Price', key: 'productPrice', width: 10 },
      { header: 'Category (EN)', key: 'categoryNameEn', width: 20 },
      { header: 'Category (AR)', key: 'categoryNameAr', width: 20 },
      { header: 'Purity %', key: 'productPurity', width: 10 },
      { header: 'Grade', key: 'productGrade', width: 15 },
      { header: 'Form', key: 'productForm', width: 10 },
      { header: 'Status', key: 'productStatus', width: 10 },
      { header: 'Discount %', key: 'productDiscount', width: 10 },
    ];
    
    // إضافة البيانات
    exportData.forEach(product => {
      worksheet.addRow(product);
    });
    
    // تحديد نوع الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.xlsx');
    
    // إرسال الملف
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export products'
    });
  }
};

  // 🟢 Download import template - UPDATED FOR NEW CATEGORY STRUCTURE
  public async downloadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Products template sheet
      const productsSheet = workbook.addWorksheet("Products", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // Define columns - UPDATED for new category structure
      productsSheet.columns = [
        { header: "Product Code", key: "productCode", width: 20 },
        { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
        { header: "Product Name (English)", key: "productNameEn", width: 30 },
        { header: "Description (Arabic)", key: "productDescriptionAr", width: 40 },
        { header: "Description (English)", key: "productDescriptionEn", width: 40 },
        { header: "Price", key: "productPrice", width: 15 },
        { header: "Category (English)", key: "categoryNameEn", width: 25 },
        { header: "Category (Arabic)", key: "categoryNameAr", width: 25 },
        { header: "Purity", key: "productPurity", width: 15 },
        { header: "Grade", key: "productGrade", width: 20 },
        { header: "Form", key: "productForm", width: 15 },
        { header: "Status", key: "productStatus", width: 15 },
        { header: "General Discount %", key: "productDiscount", width: 20 },
      ];

      // Style header
      productsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      productsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      productsSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add sample data - UPDATED for new category structure
      const sampleRow = productsSheet.addRow({
        productCode: "PROD001",
        productNameAr: "منتج تجريبي",
        productNameEn: "Sample Product",
        productDescriptionAr: "وصف المنتج باللغة العربية",
        productDescriptionEn: "Product description in English",
        productPrice: 100,
        categoryNameEn: "Category Name English (must exist in system)",
        categoryNameAr: "اسم الفئة بالعربي (يجب أن تكون موجودة في النظام)",
        productPurity: 99.5,
        productGrade: "Technical",
        productForm: "Solid",
        productStatus: "Active",
        productDiscount: 5,
      });

      // Add data validation for Grade (column J - updated position)
      productsSheet.getCell("J2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Technical,Analytical,USP,FCC,Cosmetic Grade"'],
      };

      // Add data validation for Form (column K - updated position)
      productsSheet.getCell("K2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Solid,Liquid,Gas,Powder,Granular"'],
      };

      // Add data validation for Status (column L - updated position)
      productsSheet.getCell("L2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Active,Inactive"'],
      };

      // Discount tiers template
      const discountSheet = workbook.addWorksheet("Discount Tiers", {
        properties: { tabColor: { argb: "00FF00" } },
      });

      discountSheet.columns = [
        { header: "Product Code", key: "productCode", width: 20 },
        { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
        { header: "Product Name (English)", key: "productNameEn", width: 30 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Discount %", key: "discount", width: 15 },
      ];

      // Style header
      discountSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      discountSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      discountSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add sample data
      discountSheet.addRow({
        productCode: "PROD001",
        productNameAr: "منتج تجريبي",
        productNameEn: "Sample Product",
        quantity: 10,
        discount: 10,
      });

      discountSheet.addRow({
        productCode: "PROD001",
        productNameAr: "منتج تجريبي",
        productNameEn: "Sample Product",
        quantity: 50,
        discount: 15,
      });

      // Add instructions sheet
      const instructionsSheet = workbook.addWorksheet("Instructions", {
        properties: { tabColor: { argb: "FF0000" } },
      });

      instructionsSheet.columns = [
        { header: "Instructions", key: "instructions", width: 80 },
      ];

      // Style header
      instructionsSheet.getRow(1).font = { bold: true };
      instructionsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" },
      };

      // Add instruction rows - UPDATED for new category structure
      const instructions = [
        "How to use this template:",
        "",
        "1. Products Sheet:",
        "   - Product Code: Unique identifier for the product (required)",
        "   - Product Name (Arabic): Name of the product in Arabic (required)",
        "   - Product Name (English): Name of the product in English (required)",
        "   - Description (Arabic): Product description in Arabic (required)",
        "   - Description (English): Product description in English (required)",
        "   - Price: Product price in numbers (required)",
        "   - Category (English): Must match an existing English category name in the system (required)",
        "   - Category (Arabic): Must match an existing Arabic category name in the system (required)",
        "   - Purity: Purity percentage as number (required)",
        "   - Grade: Choose from: Technical, Analytical, USP, FCC, Cosmetic Grade (required)",
        "   - Form: Choose from: Solid, Liquid, Gas, Powder, Granular (required)",
        "   - Status: Active or Inactive",
        "   - General Discount %: Default discount percentage (optional)",
        "",
        "2. Discount Tiers Sheet:",
        "   - Product Code: Must match a product code from Products sheet",
        "   - Product Name (Arabic): For reference only",
        "   - Product Name (English): For reference only",
        "   - Quantity: Minimum quantity for this discount tier",
        "   - Discount %: Discount percentage as a number (e.g., 10 for 10%)",
        "",
        "3. Important Notes:",
        "   - Do not modify column headers",
        "   - Categories must exist in the system before import",
        "   - You can provide either English or Arabic category name (or both)",
        "   - Product codes must be unique",
        "   - Both Arabic and English names are required",
        "   - Both Arabic and English descriptions are required",
        "   - Leave no empty rows between data",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          // Skip header row
          instructionsSheet.addRow([text]);
        }
      });

      // Add borders to all sheets
      [productsSheet, discountSheet].forEach((sheet) => {
        sheet.eachRow((row, rowNumber) => {
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

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=products_import_template.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // 🟢 Import products from Excel - UPDATED FOR NEW CATEGORY STRUCTURE
  public async importProducts(req: Request, res: Response, next: NextFunction) {
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

        // ✅ Products sheet
        const productsSheet = workbook.getWorksheet("Products");
        if (!productsSheet) {
          throw new Error("Missing 'Products' sheet in the uploaded file");
        }

        const productsData: any[] = [];
        const productErrors: any[] = [];

        productsSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const productCode = String(row.getCell(1).value || "").trim();
              const productNameAr = String(row.getCell(2).value || "").trim();
              const productNameEn = String(row.getCell(3).value || "").trim();
              const productDescriptionAr = String(row.getCell(4).value || "").trim();
              const productDescriptionEn = String(row.getCell(5).value || "").trim();
              const productPrice = Number(row.getCell(6).value) || 0;
              const categoryNameEn = String(row.getCell(7).value || "").trim(); // Column 7 - English category
              const categoryNameAr = String(row.getCell(8).value || "").trim(); // Column 8 - Arabic category
              const productPurity = Number(row.getCell(9).value) || 0;
              const productGrade = String(row.getCell(10).value || "").trim();
              const productForm = String(row.getCell(11).value || "").trim();
              const productStatus = String(row.getCell(12).value || "").trim();
              const productDiscount = Number(row.getCell(13).value) || 0;

              // Skip empty rows
              if (!productCode && !productNameAr && !productNameEn) return;

              // Validation - UPDATED for new category structure
              if (!productCode || !productNameAr || !productNameEn) {
                throw new Error("Missing product code, Arabic name, or English name");
              }
              if (!productDescriptionAr || !productDescriptionEn) {
                throw new Error("Missing Arabic or English description");
              }
              if ((!categoryNameEn && !categoryNameAr) || !productGrade || !productForm) {
                throw new Error(
                  "Missing required fields (category, grade, form)"
                );
              }

              const validGrades = [
                "Technical",
                "Analytical",
                "USP",
                "FCC",
                "Cosmetic Grade",
              ];
              if (!validGrades.includes(productGrade)) {
                throw new Error(`Invalid grade '${productGrade}'`);
              }

              const validForms = [
                "Solid",
                "Liquid",
                "Gas",
                "Powder",
                "Granular",
              ];
              if (!validForms.includes(productForm)) {
                throw new Error(`Invalid form '${productForm}'`);
              }

              productsData.push({
                productCode,
                productNameAr,
                productNameEn,
                productDescriptionAr,
                productDescriptionEn,
                productPrice,
                categoryNameEn,  // English category name
                categoryNameAr,  // Arabic category name
                productPurity,
                productGrade,
                productForm,
                productStatus,
                productDiscount,
              });
            } catch (err: any) {
              productErrors.push({
                row: rowNumber,
                productNameAr: String(row.getCell(2).value || "").trim() || null,
                productNameEn: String(row.getCell(3).value || "").trim() || null,
                productCode: String(row.getCell(1).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        // لو كله بايظ
        if (productsData.length === 0 && productErrors.length > 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: productErrors,
          });
        }

        // ✅ Import valid rows
        const productResults = await productService.ImportProducts(
          productsData
        );

        const importResults: any = {
          products: productResults,
          errors: productErrors,
          summary: {
            total: productsData.length + productErrors.length,
            success: productResults.success?.length || 0,
            updated: productResults.updated?.length || 0,
            failed: (productResults.failed?.length || 0) + productErrors.length,
            validationErrors: productErrors.length,
          },
        };

        // ✅ Discount Tiers
        const discountSheet = workbook.getWorksheet("Discount Tiers");
        if (discountSheet) {
          const discountMap: Record<string, any[]> = {};

          discountSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const productCode = String(row.getCell(1).value || "").trim();
              const quantity = Number(row.getCell(4).value) || 0; // Column 4
              const discount = Number(row.getCell(5).value) || 0; // Column 5

              if (
                !productCode ||
                quantity <= 0 ||
                discount < 0 ||
                discount > 100
              ) {
                return;
              }

              if (!discountMap[productCode]) {
                discountMap[productCode] = [];
              }

              discountMap[productCode].push({ quantity, discount });
            }
          });

          Object.keys(discountMap).forEach((code) => {
            discountMap[code].sort((a, b) => a.quantity - b.quantity);
          });

          const discountUpdates = Object.entries(discountMap).map(
            ([code, tiers]) => ({
              productCode: code,
              discountTiers: tiers,
            })
          );

          if (discountUpdates.length > 0) {
            const discountResults =
              await productService.BulkUpdateDiscountTiers(discountUpdates);

            importResults.discountTiers = discountResults;
            importResults.summary.discountTiersUpdated =
              discountResults.success?.length || 0;
            importResults.summary.discountTiersFailed =
              discountResults.failed?.length || 0;
          }
        }

        // ✅ Clean up file
        fs.unlinkSync(req.file.path);

        // ✅ Final response
        super.send(res, {
          message:
            productErrors.length > 0
              ? "Import completed with some issues"
              : "Import completed successfully",
          results: importResults,
        });
      } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error("Import error:", error);
        next(new Error(error.message || "Error processing import file"));
      }
    });
  }
}