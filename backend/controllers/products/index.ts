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

  // ✅ Get SubCategories by Category ID - NEW ENDPOINT
  public async getSubCategoriesByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const data = await productService.GetSubCategoriesByCategory(categoryId);
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
      if (
        productData.discountTiers &&
        typeof productData.discountTiers === "string"
      ) {
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
      // if (
      //   productData.discountTiers &&
      //   typeof productData.discountTiers === "string"
      // ) {
      //   try {
      //     productData.discountTiers = JSON.parse(productData.discountTiers);
      //   } catch (error) {
      //     console.error("Error parsing discountTiers:", error);
      //   }
      // }

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
      if (
        productData.discountTiers &&
        typeof productData.discountTiers === "string"
      ) {
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
      if (
        productData.discountTiers &&
        typeof productData.discountTiers === "string"
      ) {
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

  // ✅ Export Products - محدث لدعم SubCategory
 public async exportProducts(req: Request, res: Response) {
  try {
    // تمرير جميع query parameters للـ service
    const [exportData, discountTiersData, categoriesData] = await Promise.all([
      productService.ExportProducts(req.query),
      productService.ExportDiscountTiers(req.query),
      productService.ExportCategories(req.query),
    ]);

    console.log(
      `Exporting ${exportData.length} products, ${discountTiersData.length} discount tiers, and ${categoriesData.length} categories`
    );

    // إنشاء Excel file
    const workbook = new ExcelJS.Workbook();

    // 📋 Products Sheet - محدث لتطابق Template
    const productsWorksheet = workbook.addWorksheet("Products");

    // ✅ أعمدة مطابقة للـ Template بالضبط
    productsWorksheet.columns = [
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
      { header: "Product Name (English)", key: "productNameEn", width: 30 },
      { header: "Description (Arabic)", key: "productDescriptionAr", width: 40 },
      { header: "Description (English)", key: "productDescriptionEn", width: 40 },
      { header: "Price", key: "productPrice", width: 15 },
      { header: "Category (English)", key: "categoryNameEn", width: 25 },
      { header: "Category (Arabic)", key: "categoryNameAr", width: 25 },
      { header: "SubCategory (English)", key: "subCategoryNameEn", width: 25 },
      { header: "SubCategory (Arabic)", key: "subCategoryNameAr", width: 25 },
      { header: "Form", key: "productForm", width: 15 },
      { header: "Status", key: "productStatus", width: 15 },
      { header: "General Discount %", key: "productDiscount", width: 20 },
    ];

    // تنسيق header للمنتجات
    const productHeaderRow = productsWorksheet.getRow(1);
    productHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    productHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    productHeaderRow.alignment = { vertical: "middle", horizontal: "center" };

    // ✅ إضافة بيانات المنتجات بنفس تنسيق الـ Template
    exportData.forEach((product: any) => {
      productsWorksheet.addRow({
        productCode: product.productCode || "",
        productNameAr: product.productNameAr || "",
        productNameEn: product.productNameEn || "",
        productDescriptionAr: product.productDescriptionAr || "",
        productDescriptionEn: product.productDescriptionEn || "",
        productPrice: product.productPrice || 0,
        categoryNameEn: product.categoryNameEn || "",
        categoryNameAr: product.categoryNameAr || "",
        subCategoryNameEn: product.subCategoryNameEn || "",
        subCategoryNameAr: product.subCategoryNameAr || "",
        productForm: product.productForm || "Solid",
        productStatus: product.productStatus ? "Active" : "Inactive",
        productDiscount: product.productDiscount || 0,
      });
    });

    // 🎯 Discount Tiers Sheet - بنفس التنسيق
    if (discountTiersData.length > 0) {
      const discountWorksheet = workbook.addWorksheet("Discount Tiers");

      discountWorksheet.columns = [
        { header: "Product Code", key: "productCode", width: 20 },
        { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
        { header: "Product Name (English)", key: "productNameEn", width: 30 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Discount %", key: "discount", width: 15 },
      ];

      // تنسيق header للخصومات
      const discountHeaderRow = discountWorksheet.getRow(1);
      discountHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      discountHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      discountHeaderRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // إضافة بيانات الخصومات
      discountTiersData.forEach((tier: any) => {
        discountWorksheet.addRow({
          productCode: tier.productCode || "",
          productNameAr: tier.productNameAr || "",
          productNameEn: tier.productNameEn || "",
          quantity: tier.quantity || 0,
          discount: tier.discount || 0,
        });
      });

      // إضافة borders للـ discount sheet
      discountWorksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });
    }

    // 📊 Category Statistics Sheet - مبسط
    const categoryStatsWorksheet = workbook.addWorksheet("Category Statistics");

    categoryStatsWorksheet.columns = [
      { header: "Category Name (English)", key: "categoryNameEn", width: 25 },
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 25 },
      { header: "SubCategories Count", key: "subCategoriesCount", width: 18 },
      { header: "Total Products", key: "totalProducts", width: 15 },
      { header: "Active Products", key: "activeProducts", width: 15 },
      { header: "Inactive Products", key: "inactiveProducts", width: 15 },
      { header: "Avg Price", key: "avgPrice", width: 12 },
      { header: "Products with Discount", key: "discountedProducts", width: 18 },
    ];

    // تنسيق header للإحصائيات
    const statsHeaderRow = categoryStatsWorksheet.getRow(1);
    statsHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    statsHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9966CC" },
    };
    statsHeaderRow.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    // حساب إحصائيات الفئات
    const categoryStats: Record<string, any> = {};
    exportData.forEach((product: any) => {
      const categoryKey = product.categoryNameEn || "Unknown";
      
      if (!categoryStats[categoryKey]) {
        categoryStats[categoryKey] = {
          categoryNameEn: product.categoryNameEn || "Unknown",
          categoryNameAr: product.categoryNameAr || "غير معروف",
          products: [],
          subCategories: new Set(),
        };
      }
      
      categoryStats[categoryKey].products.push(product);
      
      if (product.subCategoryNameEn) {
        categoryStats[categoryKey].subCategories.add(product.subCategoryNameEn);
      }
    });

    // إضافة بيانات الإحصائيات
    Object.values(categoryStats).forEach((stat: any) => {
      const activeProducts = stat.products.filter((p: any) => p.productStatus).length;
      const inactiveProducts = stat.products.length - activeProducts;
      const prices = stat.products.map((p: any) => parseFloat(p.productPrice) || 0);
      const discountedProducts = stat.products.filter((p: any) => (p.productDiscount || 0) > 0).length;

      categoryStatsWorksheet.addRow({
        categoryNameEn: stat.categoryNameEn,
        categoryNameAr: stat.categoryNameAr,
        subCategoriesCount: stat.subCategories.size,
        totalProducts: stat.products.length,
        activeProducts: activeProducts,
        inactiveProducts: inactiveProducts,
        avgPrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : "0.00",
        discountedProducts: discountedProducts,
      });
    });

    // 📊 Summary Sheet
    const summaryWorksheet = workbook.addWorksheet("Export Summary");
    summaryWorksheet.columns = [
      { header: "Export Information", key: "info", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];

    const summaryHeaderRow = summaryWorksheet.getRow(1);
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    summaryHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    };

    const exportDate = new Date().toLocaleDateString();
    const exportTime = new Date().toLocaleTimeString();

    const totalSubCategories = categoriesData.reduce((sum: number, cat: any) => sum + (cat.subCategoriesCount || 0), 0);
    const productsWithSubCategories = exportData.filter((p: any) => p.subCategoryNameEn).length;

    summaryWorksheet.addRow({ info: "Export Date", value: exportDate });
    summaryWorksheet.addRow({ info: "Export Time", value: exportTime });
    summaryWorksheet.addRow({ info: "Total Products", value: exportData.length });
    summaryWorksheet.addRow({ info: "Products with SubCategories", value: productsWithSubCategories });
    summaryWorksheet.addRow({ info: "Total Categories", value: categoriesData.length });
    summaryWorksheet.addRow({ info: "Total SubCategories", value: totalSubCategories });
    summaryWorksheet.addRow({ info: "Active Categories", value: categoriesData.filter((c: any) => c.categoryStatus).length });
    summaryWorksheet.addRow({ info: "Total Discount Tiers", value: discountTiersData.length });
    summaryWorksheet.addRow({ info: "Products with Discounts", value: discountTiersData.length > 0 ? new Set(discountTiersData.map((t: any) => t.productCode)).size : 0 });

    // إضافة borders لجميع الـ sheets
    [productsWorksheet, categoryStatsWorksheet, summaryWorksheet].forEach(worksheet => {
      worksheet.eachRow((row) => {
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

    // تحديد نوع الاستجابة
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=products_export_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    // إرسال الملف
    await workbook.xlsx.write(res);
    res.end();

  } catch (error: any) {
    console.log("Export error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to export products",
    });
  }
}

  // ✅ Download Template - محدث لدعم SubCategory
  public async downloadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Bariqe El Tamioz";
      workbook.lastModifiedBy = "Bariqe El Tamioz System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Products template sheet
      const productsSheet = workbook.addWorksheet("Products", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // ✅ Define columns مع SubCategory
      productsSheet.columns = [
        { header: "Product Code", key: "productCode", width: 20 },
        { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
        { header: "Product Name (English)", key: "productNameEn", width: 30 },
        {
          header: "Description (Arabic)",
          key: "productDescriptionAr",
          width: 40,
        },
        {
          header: "Description (English)",
          key: "productDescriptionEn",
          width: 40,
        },
        { header: "Price", key: "productPrice", width: 15 },
        { header: "Category (English)", key: "categoryNameEn", width: 25 },
        { header: "Category (Arabic)", key: "categoryNameAr", width: 25 },
        { header: "SubCategory (English)", key: "subCategoryNameEn", width: 25 }, // ✅ جديد
        { header: "SubCategory (Arabic)", key: "subCategoryNameAr", width: 25 }, // ✅ جديد
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

      // ✅ Add sample data مع SubCategory
      const sampleRow = productsSheet.addRow({
        productCode: "PROD001",
        productNameAr: "منتج تجريبي",
        productNameEn: "Sample Product",
        productDescriptionAr: "وصف المنتج باللغة العربية",
        productDescriptionEn: "Product description in English",
        productPrice: 100,
        categoryNameEn: "Category Name English (must exist in system)",
        categoryNameAr: "اسم الفئة بالعربي (يجب أن تكون موجودة في النظام)",
        subCategoryNameEn: "SubCategory Name English (must exist in selected category)", // ✅ جديد
        subCategoryNameAr: "اسم الفئة الفرعية بالعربي (يجب أن تكون موجودة في الفئة المحددة)", // ✅ جديد
        productForm: "Solid",
        productStatus: "Active",
        productDiscount: 5,
      });

      // ✅ Add data validation for Form (column K - updated position)
      productsSheet.getCell("K2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Solid,Liquid,Gas,Powder,Granular"'],
      };

      // ✅ Add data validation for Status (column L - updated position)
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

      // ✅ Add instruction rows مع SubCategory
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
        "   - SubCategory (English): Must match an existing English subcategory name in the selected category (required)", // ✅ جديد
        "   - SubCategory (Arabic): Must match an existing Arabic subcategory name in the selected category (required)", // ✅ جديد
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
        "   - Categories and SubCategories must exist in the system before import",
        "   - SubCategory must belong to the selected Category",
        "   - You can provide either English or Arabic names (or both) for categories and subcategories",
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

  // ✅ Import products - محدث لدعم SubCategory
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
              const productDescriptionAr = String(
                row.getCell(4).value || ""
              ).trim();
              const productDescriptionEn = String(
                row.getCell(5).value || ""
              ).trim();
              const productPrice = Number(row.getCell(6).value) || 0;
              const categoryNameEn = String(row.getCell(7).value || "").trim();
              const categoryNameAr = String(row.getCell(8).value || "").trim();
              const subCategoryNameEn = String(row.getCell(9).value || "").trim(); // ✅ جديد
              const subCategoryNameAr = String(row.getCell(10).value || "").trim(); // ✅ جديد
              const productForm = String(row.getCell(11).value || "").trim(); // ✅ تحديث position
              const productStatus = String(row.getCell(12).value || "").trim(); // ✅ تحديث position
              const productDiscount = Number(row.getCell(13).value) || 0; // ✅ تحديث position

              // Skip empty rows
              if (!productCode && !productNameAr && !productNameEn) return;

              // ✅ Validation محدث لدعم SubCategory
              if (!productCode || !productNameAr || !productNameEn) {
                throw new Error(
                  "Missing product code, Arabic name, or English name"
                );
              }
              if (!productDescriptionAr || !productDescriptionEn) {
                throw new Error("Missing Arabic or English description");
              }
              if ((!categoryNameEn && !categoryNameAr)) {
                throw new Error(
                  "Missing required fields (category)"
                );
              }
              if ((!subCategoryNameEn && !subCategoryNameAr)) { // ✅ جديد
                throw new Error(
                  "Missing required fields (subcategory)"
                );
              }

              productsData.push({
                productCode,
                productNameAr,
                productNameEn,
                productDescriptionAr,
                productDescriptionEn,
                productPrice,
                categoryNameEn,
                categoryNameAr,
                subCategoryNameEn, // ✅ جديد
                subCategoryNameAr, // ✅ جديد
                productForm,
                productStatus,
                productDiscount,
              });
            } catch (err: any) {
              productErrors.push({
                row: rowNumber,
                productNameAr:
                  String(row.getCell(2).value || "").trim() || null,
                productNameEn:
                  String(row.getCell(3).value || "").trim() || null,
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
              const quantity = Number(row.getCell(4).value) || 0;
              const discount = Number(row.getCell(5).value) || 0;

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