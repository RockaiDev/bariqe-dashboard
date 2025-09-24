// src/controllers/database/index.ts
import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";

// Import all services
import MaterialRequestService from '../../services/mongodb/materialRequests/index';
import ConsultationRequestsService from '../../services/mongodb/consultationRequests/index';
import EventService from '../../services/mongodb/events/index';
import ProductService from "../../services/mongodb/product";
import OrderService from "../../services/mongodb/orders";
import CustomerService from "../../services/mongodb/customer";
import CategoryService from "../../services/mongodb/category";

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
    cb(null, `backup_restore_${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      return cb(new Error("Only Excel files are allowed"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Initialize services
const productService = new ProductService();
const orderService = new OrderService();
const customerService = new CustomerService();
const categoryService = new CategoryService();
const materialRequestService = new MaterialRequestService();
const consultationRequestsService = new ConsultationRequestsService();
const eventService = new EventService();

// src/controllers/database/index.ts - هنحتفظ بس بالـ backup/restore functions

export default class DatabaseController extends BaseApi {

  /**
   * 🟢 FULL DATABASE BACKUP - مصحح
   */
  public async backupDatabase(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("Starting full database backup...");

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem System";
      workbook.created = new Date();

      // Get all data
      const [
        categoriesData,
        customersData,
        productsData,
        ordersData,
        materialRequestsData,
        consultationRequestsData,
        eventsData
      ] = await Promise.allSettled([
        categoryService.ExportCategories({}),
        customerService.ExportCustomers({}),
        productService.ExportProducts({}),
        orderService.ExportOrders({}),
        materialRequestService.ExportMaterialRequests({}),
        consultationRequestsService.ExportConsultationRequests({}),
        eventService.ExportEvents({})
      ]);

      const getData = (result: any) => result.status === 'fulfilled' ? result.value : [];

      const categories = getData(categoriesData);
      const customers = getData(customersData);
      const products = getData(productsData);
      const orders = getData(ordersData);
      const materialRequests = getData(materialRequestsData);
      const consultationRequests = getData(consultationRequestsData);
      const events = getData(eventsData);

      // Create sheets in proper order
      this.createCategoriesBackupSheet(workbook, categories);
      this.createCustomersBackupSheet(workbook, customers);
      this.createProductsBackupSheet(workbook, products);
      this.createDiscountTiersBackupSheet(workbook, products);
      this.createOrdersBackupSheet(workbook, orders);
      this.createMaterialRequestsBackupSheet(workbook, materialRequests);
      this.createConsultationRequestsBackupSheet(workbook, consultationRequests);
      this.createEventsBackupSheet(workbook, events);

      // Add summary sheet
      this.createBackupSummarySheet(workbook, {
        categories: categories?.length || 0,
        customers: customers?.length || 0,
        products: products?.length || 0,
        orders: orders?.length || 0,
        materialRequests: materialRequests?.length || 0,
        consultationRequests: consultationRequests?.length || 0,
        events: events?.length || 0,
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=AlexChem_Full_Backup_${timestamp}.xlsx`);

      await workbook.xlsx.write(res);
      console.log("Database backup completed successfully");

    } catch (err) {
      console.error("Database backup error:", err);
      next(err);
    }
  }

  /**
   * 🟢 FULL DATABASE RESTORE - مصحح
   */
  public async restoreDatabase(req: Request, res: Response, next: NextFunction) {
    const uploadSingle = upload.single("file");

    uploadSingle(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No backup file uploaded" });
      }

      try {
        console.log("Starting database restore from:", req.file.filename);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        const restoreResults: any = {
          summary: {},
          errors: [],
          success: [],
        };

        // Restore in proper order: Categories → Customers → Products → Orders → Others
        await this.restoreCategories(workbook, restoreResults);
        await this.restoreCustomers(workbook, restoreResults);
        await this.restoreProducts(workbook, restoreResults);
        await this.restoreDiscountTiers(workbook, restoreResults);
        await this.restoreOrders(workbook, restoreResults);
        await this.restoreMaterialRequests(workbook, restoreResults);
        await this.restoreConsultationRequests(workbook, restoreResults);
        await this.restoreEvents(workbook, restoreResults);

        // Calculate summary
        restoreResults.summary = {
          totalProcessed: Object.values(restoreResults).reduce((total: number, result: any) => {
            if (result?.success?.length) total += result.success.length;
            if (result?.updated?.length) total += result.updated.length;
            return total;
          }, 0),
          totalErrors: Object.values(restoreResults).reduce((total: number, result: any) => {
            if (result?.failed?.length) total += result.failed.length;
            return total;
          }, 0),
          restoreDate: new Date()
        };

        fs.unlinkSync(req.file.path);

        super.send(res, {
          message: "Database restore completed",
          results: restoreResults,
        });

      } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error("Database restore error:", error);
        next(new Error(error.message || "Error processing restore file"));
      }
    });
  }

  /**
   * 🟢 DOWNLOAD COMPLETE TEMPLATE
   */
  public async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem System";
      workbook.created = new Date();

      // Create all template sheets
      this.createCategoriesTemplateSheet(workbook);
      this.createCustomersTemplateSheet(workbook);
      this.createProductsTemplateSheet(workbook);
      this.createDiscountTiersTemplateSheet(workbook);
      this.createOrdersTemplateSheet(workbook);
      this.createMaterialRequestsTemplateSheet(workbook);
      this.createConsultationRequestsTemplateSheet(workbook);
      this.createEventsTemplateSheet(workbook);

      // Add comprehensive instructions
      this.createCompleteInstructionsSheet(workbook);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=AlexChem_Complete_Import_Template.xlsx");

      await workbook.xlsx.write(res);

    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // Helper methods
  private styleSheetHeader(sheet: ExcelJS.Worksheet, color: string) {
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  }

  private addBordersToSheet(sheet: ExcelJS.Worksheet) {
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
  }

  private extractSheetData(sheet: ExcelJS.Worksheet, columns: string[]): any[] {
    const data: any[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const rowData: any = {};
        let hasData = false;
        
        columns.forEach((column, index) => {
          const cellValue = row.getCell(index + 1).value;
          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            if (cellValue instanceof Date) {
              rowData[column] = cellValue.toISOString();
            } else {
              rowData[column] = String(cellValue).trim();
            }
            hasData = true;
          }
        });
        
        if (hasData) {
          data.push(rowData);
        }
      }
    });

    return data;
  }




  private createCategoriesBackupSheet(workbook: ExcelJS.Workbook, categories: any[]) {
    if (!categories?.length) return;

    const sheet = workbook.addWorksheet("Categories");
    sheet.columns = [
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 30 },
      { header: "Category Name (English)", key: "categoryNameEn", width: 30 },
      { header: "Category Description (Arabic)", key: "categoryDescriptionAr", width: 40 },
      { header: "Category Description (English)", key: "categoryDescriptionEn", width: 40 },
      { header: "Category Status", key: "categoryStatus", width: 15 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];

    this.styleSheetHeader(sheet, "FFFFC107");

    categories.forEach((category) => {
      const row = sheet.addRow({
        categoryNameAr: category.categoryNameAr || "",
        categoryNameEn: category.categoryNameEn || "",
        categoryDescriptionAr: category.categoryDescriptionAr || "",
        categoryDescriptionEn: category.categoryDescriptionEn || "",
        categoryStatus: category.categoryStatus ? "Active" : "Inactive",
        createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
        updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      });
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });

    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Products backup للمودل الجديد
  private createProductsBackupSheet(workbook: ExcelJS.Workbook, products: any[]) {
    if (!products?.length) return;
    
    const sheet = workbook.addWorksheet("Products");
    sheet.columns = [
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
      { header: "Product Name (English)", key: "productNameEn", width: 30 },
      { header: "Product Description (Arabic)", key: "productDescriptionAr", width: 40 },
      { header: "Product Description (English)", key: "productDescriptionEn", width: 40 },
      { header: "Product Price", key: "productPrice", width: 15 },
      { header: "Category Name (English)", key: "categoryNameEn", width: 25 },
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 25 },
      { header: "Product Purity", key: "productPurity", width: 15 },
      { header: "Product Grade", key: "productGrade", width: 15 },
      { header: "Product Form", key: "productForm", width: 15 },
      { header: "Product Status", key: "productStatus", width: 15 },
      { header: "Product Discount", key: "productDiscount", width: 15 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FF4472C4");
    
    products.forEach((product) => {
      const row = sheet.addRow({
        productCode: product.productCode,
        productNameAr: product.productNameAr || "",
        productNameEn: product.productNameEn || "",
        productDescriptionAr: product.productDescriptionAr || "",
        productDescriptionEn: product.productDescriptionEn || "",
        productPrice: product.productPrice || 0,
        categoryNameEn: product.categoryNameEn || "",
        categoryNameAr: product.categoryNameAr || "",
        productPurity: product.productPurity || 0,
        productGrade: product.productGrade,
        productForm: product.productForm,
        productStatus: product.productStatus ? "Active" : "Inactive",
        productDiscount: product.productDiscount || 0,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      });
      row.getCell("productPrice").numFmt = "$#,##0.00";
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });
    
    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Discount Tiers backup للمودل الجديد
  private createDiscountTiersBackupSheet(workbook: ExcelJS.Workbook, products: any[]) {
    if (!products?.length) return;

    const sheet = workbook.addWorksheet("Discount Tiers", {
      properties: { tabColor: { argb: "00FF00" } },
    });

    sheet.columns = [
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
      { header: "Product Name (English)", key: "productNameEn", width: 30 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Discount %", key: "discount", width: 15 },
    ];

    this.styleSheetHeader(sheet, "FF70AD47");

    products.forEach((product) => {
      if (product.discountTiers && product.discountTiers.length > 0) {
        product.discountTiers.forEach((tier: any) => {
          const row = sheet.addRow({
            productCode: product.productCode,
            productNameAr: product.productNameAr || "",
            productNameEn: product.productNameEn || "",
            quantity: tier.quantity,
            discount: tier.discount,
          });
        });
      }
    });

    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Events backup للمودل الجديد
  private createEventsBackupSheet(workbook: ExcelJS.Workbook, events: any[]) {
    if (!events?.length) return;
    
    const sheet = workbook.addWorksheet("Events");
    sheet.columns = [
      { header: "Title (Arabic)", key: "titleAr", width: 30 },
      { header: "Title (English)", key: "titleEn", width: 30 },
      { header: "Date", key: "date", width: 20 },
      { header: "Tags", key: "tags", width: 25 },
      { header: "Content (Arabic)", key: "contentAr", width: 50 },
      { header: "Content (English)", key: "contentEn", width: 50 },
      { header: "Status", key: "status", width: 15 },
      { header: "Author", key: "author", width: 20 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FFFD7E14");
    
    events.forEach((event) => {
      const row = sheet.addRow({
        titleAr: event.titleAr || "",
        titleEn: event.titleEn || "",
        date: event.date ? new Date(event.date) : new Date(),
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '',
        contentAr: event.contentAr || "",
        contentEn: event.contentEn || "",
        status: event.status || "draft",
        author: event.author || "System",
        createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
        updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      });
      row.getCell("date").numFmt = "yyyy-mm-dd";
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });
    
    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Categories restore للمودل الجديد
  private async restoreCategories(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Categories");
    if (!sheet) return;

    try {
      const categoriesData = this.extractSheetData(sheet, [
        "categoryNameAr", "categoryNameEn", "categoryDescriptionAr", "categoryDescriptionEn", "categoryStatus"
      ]);
      
      if (categoriesData.length > 0) {
        const processedCategories = categoriesData.map(cat => ({
          ...cat,
          categoryStatus: cat.categoryStatus === "Active" || cat.categoryStatus === true,
        }));

        results.categories = await categoryService.ImportCategories(processedCategories);
      }
    } catch (error) {
      console.error("Error restoring categories:", error);
      results.categoryError = error;
    }
  }

  // 🔧 UPDATED: Products restore للمودل الجديد
  private async restoreProducts(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Products");
    if (!sheet) return;

    try {
      const productsData = this.extractSheetData(sheet, [
        "productCode", "productNameAr", "productNameEn", "productDescriptionAr", "productDescriptionEn", 
        "productPrice", "categoryNameEn", "categoryNameAr", "productPurity", "productGrade", 
        "productForm", "productStatus", "productDiscount"
      ]);
      
      if (productsData.length > 0) {
        const processedProducts = productsData.map(product => ({
          ...product,
          productStatus: product.productStatus === "Active" || product.productStatus === true,
          productPrice: Number(product.productPrice) || 0,
          productPurity: Number(product.productPurity) || 0,
          productDiscount: Number(product.productDiscount) || 0
        }));
        
        results.products = await productService.ImportProducts(processedProducts);
      }
    } catch (error) {
      console.error("Error restoring products:", error);
      results.productError = error;
    }
  }

  // 🔧 UPDATED: Discount Tiers restore للمودل الجديد
  private async restoreDiscountTiers(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Discount Tiers");
    if (!sheet) return;

    try {
      const discountTiersData = this.extractSheetData(sheet, [
        "productCode", "productNameAr", "productNameEn", "quantity", "discount"
      ]);

      if (discountTiersData.length > 0) {
        // Group by product code
        const groupedTiers: Record<string, any[]> = {};
        
        discountTiersData.forEach(tier => {
          const productCode = tier.productCode;
          if (!groupedTiers[productCode]) {
            groupedTiers[productCode] = [];
          }
          groupedTiers[productCode].push({
            quantity: Number(tier.quantity) || 0,
            discount: Number(tier.discount) || 0
          });
        });

        const processedDiscountTiers = Object.entries(groupedTiers).map(([productCode, tiers]) => ({
          productCode,
          discountTiers: tiers
        }));

        results.discountTiers = await productService.BulkUpdateDiscountTiers(processedDiscountTiers);
      }
    } catch (error) {
      console.error("Error restoring discount tiers:", error);
      results.discountTiersError = error;
    }
  }

  // 🔧 UPDATED: Events restore للمودل الجديد
  private async restoreEvents(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Events");
    if (!sheet) return;

    try {
      const eventsData = this.extractSheetData(sheet, [
        "titleAr", "titleEn", "date", "tags", "contentAr", "contentEn", "status", "author"
      ]);
      
      if (eventsData.length > 0) {
        const processedEvents = eventsData.map(event => ({
          ...event,
          date: event.date ? new Date(event.date) : new Date(),
          tags: typeof event.tags === 'string' ? event.tags.split(',').map((tag: string) => tag.trim()) : [],
          status: event.status || "draft",
          author: event.author || "System"
        }));
        
        results.events = await eventService.ImportEvents(processedEvents);
      }
    } catch (error) {
      console.error("Error restoring events:", error);
      results.eventError = error;
    }
  }

  // 🔧 UPDATED: Categories template للمودل الجديد
  private createCategoriesTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Categories");
    sheet.columns = [
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 30 },
      { header: "Category Name (English)", key: "categoryNameEn", width: 30 },
      { header: "Category Description (Arabic)", key: "categoryDescriptionAr", width: 50 },
      { header: "Category Description (English)", key: "categoryDescriptionEn", width: 50 },
      { header: "Category Status", key: "categoryStatus", width: 15 },
    ];
    
    this.styleSheetHeader(sheet, "FFFFC107");
    
    sheet.addRow({
      categoryNameAr: "كيماويات المختبر",
      categoryNameEn: "Laboratory Chemicals",
      categoryDescriptionAr: "كيماويات عالية النقاء للاستخدام في المختبرات",
      categoryDescriptionEn: "High-purity chemicals for laboratory use",
      categoryStatus: "Active",
    });
    
    sheet.getCell("E2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Active,Inactive"'],
    };
    
    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Products template للمودل الجديد
  private createProductsTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Products");
    sheet.columns = [
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
      { header: "Product Name (English)", key: "productNameEn", width: 30 },
      { header: "Product Description (Arabic)", key: "productDescriptionAr", width: 40 },
      { header: "Product Description (English)", key: "productDescriptionEn", width: 40 },
      { header: "Product Price", key: "productPrice", width: 15 },
      { header: "Category Name (English)", key: "categoryNameEn", width: 25 },
      { header: "Category Name (Arabic)", key: "categoryNameAr", width: 25 },
      { header: "Product Purity", key: "productPurity", width: 15 },
      { header: "Product Grade", key: "productGrade", width: 20 },
      { header: "Product Form", key: "productForm", width: 15 },
      { header: "Product Status", key: "productStatus", width: 15 },
      { header: "Product Discount", key: "productDiscount", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FF4472C4");
    
    sheet.addRow({
      productCode: "NACL001",
      productNameAr: "كلوريد الصوديوم",
      productNameEn: "Sodium Chloride",
      productDescriptionAr: "كلوريد الصوديوم عالي النقاء للاستخدام في المختبرات",
      productDescriptionEn: "High purity sodium chloride for laboratory use",
      productPrice: 25.99,
      categoryNameEn: "Laboratory Chemicals",
      categoryNameAr: "كيماويات المختبر",
      productPurity: 99.5,
      productGrade: "Analytical",
      productForm: "Solid",
      productStatus: "Active",
      productDiscount: 5,
    });
    
    // Add validations
    sheet.getCell("J2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Technical,Analytical,USP,FCC,Cosmetic Grade"'],
    };
    sheet.getCell("K2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Solid,Liquid,Gas,Powder,Granular"'],
    };
    sheet.getCell("L2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Active,Inactive"'],
    };
    
    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Discount Tiers template للمودل الجديد
  private createDiscountTiersTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Discount Tiers", {
      properties: { tabColor: { argb: "00FF00" } },
    });

    sheet.columns = [
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Product Name (Arabic)", key: "productNameAr", width: 30 },
      { header: "Product Name (English)", key: "productNameEn", width: 30 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Discount %", key: "discount", width: 15 },
    ];

    this.styleSheetHeader(sheet, "FF70AD47");

    sheet.addRow({
      productCode: "NACL001",
      productNameAr: "كلوريد الصوديوم",
      productNameEn: "Sodium Chloride",
      quantity: 10,
      discount: 5,
    });

    sheet.addRow({
      productCode: "NACL001",
      productNameAr: "كلوريد الصوديوم",
      productNameEn: "Sodium Chloride",
      quantity: 50,
      discount: 10,
    });

    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Events template للمودل الجديد
  private createEventsTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Events");
    sheet.columns = [
      { header: "Title (Arabic)", key: "titleAr", width: 30 },
      { header: "Title (English)", key: "titleEn", width: 30 },
      { header: "Date", key: "date", width: 15 },
      { header: "Tags", key: "tags", width: 25 },
      { header: "Content (Arabic)", key: "contentAr", width: 50 },
      { header: "Content (English)", key: "contentEn", width: 50 },
      { header: "Status", key: "status", width: 15 },
      { header: "Author", key: "author", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FFFD7E14");
    
    sheet.addRow({
      titleAr: "ورشة عمل السلامة الكيميائية",
      titleEn: "Chemical Safety Workshop",
      date: new Date(),
      tags: "safety, workshop, training",
      contentAr: "انضم إلينا في ورشة عمل شاملة حول السلامة الكيميائية تغطي أفضل الممارسات وبروتوكولات السلامة.",
      contentEn: "Join us for a comprehensive chemical safety workshop covering best practices and safety protocols.",
      status: "published",
      author: "Safety Team",
    });
    
    sheet.getCell("G2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"draft,published,archived"'],
    };
    
    this.addBordersToSheet(sheet);
  }

  // 🔧 UPDATED: Instructions للمودلز الجديدة
  private createCompleteInstructionsSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Instructions");
    sheet.columns = [{ header: "Instructions", key: "instructions", width: 100 }];
    this.styleSheetHeader(sheet, "FFFF0000");

    const instructions = [
      "ALEXCHEM DATABASE IMPORT TEMPLATE - COMPLETE GUIDE (UPDATED FOR MULTILINGUAL SUPPORT)",
      "",
      "🚨 CRITICAL: IMPORT ORDER MATTERS! 🚨",
      "You MUST import in this exact sequence:",
      "1. Categories FIRST (products depend on categories)",
      "2. Customers SECOND (orders depend on customers)",
      "3. Products THIRD (orders depend on products)",
      "4. Orders FOURTH (depends on customers + products)",
      "5. Material Requests (independent)",
      "6. Consultation Requests (independent, creates customers)",
      "7. Events (independent)",
      "",
      "🌐 NEW: MULTILINGUAL SUPPORT:",
      "- Categories: Arabic and English names/descriptions required",
      "- Products: Arabic and English names/descriptions required",
      "- Events: Arabic and English titles/content required",
      "",
      "🔥 KEY RULES FOR SUCCESS:",
      "- Follow the import order above",
      "- Do NOT modify column headers",
      "- Remove ALL sample data before importing real data",
      "- Make sure required fields are filled in BOTH languages",
      "- References must match EXACTLY (case-sensitive)",
      "",
      "📊 CATEGORIES:",
      "- Must be imported FIRST",
      "- Arabic Name: Required, must be unique",
      "- English Name: Required, must be unique", 
      "- Arabic Description: Required",
      "- English Description: Required",
      "- Status: 'Active' or 'Inactive' only",
      "",
      "🧪 PRODUCTS:",
      "- Must be imported AFTER categories",
      "- Product Code: Must be unique",
      "- Arabic Name: Required",
      "- English Name: Required",
      "- Arabic Description: Required",
      "- English Description: Required",
      "- Category Names: Must match existing category EXACTLY (provide Arabic OR English)",
      "- Status: 'Active' or 'Inactive'",
      "",
      "📅 EVENTS:",
      "- Arabic Title: Required",
      "- English Title: Required",
      "- Arabic Content: Required",
      "- English Content: Required",
      "- Status: 'draft', 'published', or 'archived'",
      "",
      "💡 DISCOUNT TIERS:",
      "- Linked to products via Product Code",
      "- Multiple tiers allowed per product",
      "- Quantity must be ascending order",
      "",
      "This template supports the new multilingual database structure.",
      "All text fields now support both Arabic and English content.",
    ];

    instructions.forEach((instruction, index) => {
      if (index > 0) sheet.addRow([instruction]);
    });
  }









  // 🔧 FIXED: Backup sheet creators


  private createCustomersBackupSheet(workbook: ExcelJS.Workbook, customers: any[]) {
    if (!customers?.length) return;
    
    const sheet = workbook.addWorksheet("Customers");
    sheet.columns = [
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Customer Phone", key: "customerPhone", width: 20 },
      { header: "Customer Address", key: "customerAddress", width: 40 },
      { header: "Customer Notes", key: "customerNotes", width: 40 },
      { header: "Customer Source", key: "customerSource", width: 25 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FFDC3545");
    
    customers.forEach((customer) => {
      const row = sheet.addRow({
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        customerAddress: customer.customerAddress || "",
        customerNotes: customer.customerNotes || "",
        customerSource: customer.customerSource || "",
        createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
        updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : new Date(),
      });
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });
    
    this.addBordersToSheet(sheet);
  }



  private createOrdersBackupSheet(workbook: ExcelJS.Workbook, orders: any[]) {
    if (!orders?.length) return;
    
    const sheet = workbook.addWorksheet("Orders");
    sheet.columns = [
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Order Quantity", key: "orderQuantity", width: 15 },
      { header: "Order Discount", key: "orderDiscount", width: 15 },
      { header: "Order Status", key: "orderStatus", width: 15 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FF28A745");
    
    orders.forEach((order) => {
      const row = sheet.addRow({
        customerEmail: order.customerEmail,
        productCode: order.productCode,
        quantity: order.quantity || 1,
        orderQuantity: order.orderQuantity || order.quantity || 1,
        orderDiscount: order.orderDiscount || 0,
        orderStatus: order.orderStatus || "pending",
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
      });
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });
    
    this.addBordersToSheet(sheet);
  }

  private createMaterialRequestsBackupSheet(workbook: ExcelJS.Workbook, requests: any[]) {
    if (!requests?.length) return;
    
    const sheet = workbook.addWorksheet("Material Requests");
    sheet.columns = [
      { header: "Material Name", key: "materialName", width: 30 },
      { header: "Material Email", key: "materialEmail", width: 30 },
      { header: "Material Phone", key: "materialPhone", width: 20 },
      { header: "Material Quantity", key: "materialQuantity", width: 15 },
      { header: "Material Intended Use", key: "materialIntendedUse", width: 40 },
      { header: "Material Actions", key: "materialActions", width: 15 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FF17A2B8");
    
    requests.forEach((request) => {
      const row = sheet.addRow({
        materialName: request.materialName,
        materialEmail: request.materialEmail,
        materialPhone: request.materialPhone,
        materialQuantity: request.materialQuantity,
        materialIntendedUse: request.materialIntendedUse,
        materialActions: request.materialActions || "pending",
        createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
        updatedAt: request.updatedAt ? new Date(request.updatedAt) : new Date(),
      });
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });
    
    this.addBordersToSheet(sheet);
  }

  private createConsultationRequestsBackupSheet(workbook: ExcelJS.Workbook, requests: any[]) {
    if (!requests?.length) return;

    const sheet = workbook.addWorksheet("Consultation Requests");
    sheet.columns = [
      { header: "Request ID", key: "requestId", width: 25 },
      { header: "Consultation Name", key: "requestName", width: 25 },
      { header: "Consultation Email", key: "email", width: 30 },
      { header: "Consultation Phone", key: "phone", width: 20 },
      { header: "Consultation Area", key: "area", width: 25 },
      { header: "Consultation Message", key: "message", width: 50 },
      { header: "Consultation Status", key: "status", width: 15 },
      { header: "Customer Address", key: "customerAddress", width: 30 },
      { header: "Customer ID", key: "customerId", width: 25 },
      { header: "Created Date", key: "createdAt", width: 20 },
      { header: "Updated Date", key: "updatedAt", width: 20 },
    ];

    this.styleSheetHeader(sheet, "FF6610F2");

    requests.forEach((request) => {
      const row = sheet.addRow({
        requestId: request.requestId || "",
        requestName: request.requestName || "",
        email: request.email || "",
        phone: request.phone || "",
        area: request.area || "",
        message: request.message || "",
        status: request.status || "new",
        customerAddress: request.customerAddress || "",
        customerId: request.customerId || "",
        createdAt: request.requestDate ? new Date(request.requestDate) : new Date(),
        updatedAt: request.lastUpdated ? new Date(request.lastUpdated) : new Date(),
      });
      row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
      row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
    });

    this.addBordersToSheet(sheet);
  }



  private createBackupSummarySheet(workbook: ExcelJS.Workbook, summary: any) {
    const sheet = workbook.addWorksheet("Backup Summary");
    sheet.columns = [
      { header: "Data Type", key: "dataType", width: 25 },
      { header: "Records Count", key: "count", width: 15 },
      { header: "Backup Date", key: "backupDate", width: 25 },
    ];
    
    this.styleSheetHeader(sheet, "FF000000");

    const backupTimestamp = new Date();
    const summaryData = [
      { dataType: "Categories", count: summary.categories, backupDate: backupTimestamp },
      { dataType: "Customers", count: summary.customers, backupDate: backupTimestamp },
      { dataType: "Products", count: summary.products, backupDate: backupTimestamp },
      { dataType: "Orders", count: summary.orders, backupDate: backupTimestamp },
      { dataType: "Material Requests", count: summary.materialRequests, backupDate: backupTimestamp },
      { dataType: "Consultation Requests", count: summary.consultationRequests, backupDate: backupTimestamp },
      { dataType: "Events", count: summary.events, backupDate: backupTimestamp },
    ];

    summaryData.forEach(item => {
      const row = sheet.addRow(item);
      row.getCell("backupDate").numFmt = "yyyy-mm-dd hh:mm:ss";
    });
    
    this.addBordersToSheet(sheet);
  }

  // 🔧 FIXED: Restore methods


  private async restoreCustomers(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Customers");
    if (!sheet) return;

    try {
      const customersData = this.extractSheetData(sheet, [
        "customerName", "customerEmail", "customerPhone", "customerAddress", "customerNotes", "customerSource"
      ]);
      
      if (customersData.length > 0) {
        results.customers = await customerService.ImportCustomers(customersData);
      }
    } catch (error) {
      console.error("Error restoring customers:", error);
      results.customerError = error;
    }
  }



  private async restoreOrders(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Orders");
    if (!sheet) return;

    try {
      const ordersData = this.extractSheetData(sheet, [
        "customerEmail", "productCode", "quantity", "orderQuantity", "orderDiscount", "orderStatus"
      ]);
      
      if (ordersData.length > 0) {
        const processedOrders = ordersData.map(order => ({
          ...order,
          quantity: Number(order.quantity) || 1,
          orderQuantity: Number(order.orderQuantity) || Number(order.quantity) || 1,
          orderDiscount: Number(order.orderDiscount) || 0
        }));
        
        results.orders = await orderService.ImportOrders(processedOrders);
      }
    } catch (error) {
      console.error("Error restoring orders:", error);
      results.orderError = error;
    }
  }

  private async restoreMaterialRequests(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Material Requests");
    if (!sheet) return;

    try {
      const requestsData = this.extractSheetData(sheet, [
        "materialName", "materialEmail", "materialPhone", "materialQuantity", "materialIntendedUse", "materialActions"
      ]);
      
      if (requestsData.length > 0) {
        results.materialRequests = await materialRequestService.ImportMaterialRequests(requestsData);
      }
    } catch (error) {
      console.error("Error restoring material requests:", error);
      results.materialRequestError = error;
    }
  }

  // 🔧 FIXED: Consultation requests restore
  private async restoreConsultationRequests(workbook: ExcelJS.Workbook, results: any) {
    const sheet = workbook.getWorksheet("Consultation Requests");
    if (!sheet) {
      console.log("No 'Consultation Requests' sheet found in workbook");
      return;
    }

    try {
      // Use the correct column names that match the backup sheet
      const requestsData = this.extractSheetData(sheet, [
        "requestName", "email", "phone", "area", "message", "status"
      ]);

      console.log(`Found ${requestsData.length} consultation requests to restore`);
      console.log("Sample data:", requestsData[0]);

      if (requestsData.length > 0) {
        // Clean and validate data - map to the expected format for the service
        const processedRequests = requestsData.map(request => ({
          consultationRequestsName: request.requestName || "",
          consultationRequestsEmail: request.email || "",
          consultationRequestsPhone: request.phone || "",
          consultationRequestsArea: request.area || "",
          consultationRequestsMessage: request.message || "",
          consultationRequestsStatus: request.status || "new"
        })).filter(request =>
          request.consultationRequestsName &&
          request.consultationRequestsEmail &&
          request.consultationRequestsPhone &&
          request.consultationRequestsArea &&
          request.consultationRequestsMessage
        );

        console.log(`Processing ${processedRequests.length} valid consultation requests`);
        console.log("Sample processed data:", processedRequests[0]);

        if (processedRequests.length > 0) {
          results.consultationRequests = await consultationRequestsService.ImportConsultationRequests(processedRequests);
          console.log("Consultation requests imported successfully");
        } else {
          console.log("No valid consultation requests to import");
        }
      }
    } catch (error) {
      console.error("Error restoring consultation requests:", error);
      results.consultationRequestError = error;
    }
  }



  // Template creators (نفس الكود بس للـ template)
 
  private createCustomersTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Customers");
    sheet.columns = [
      { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Customer Phone", key: "customerPhone", width: 20 },
      { header: "Customer Address", key: "customerAddress", width: 40 },
      { header: "Customer Notes", key: "customerNotes", width: 40 },
      { header: "Customer Source", key: "customerSource", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FFDC3545");
    
    sheet.addRow({
      customerName: "John Doe",
      customerEmail: "john.doe@example.com",
      customerPhone: "+1234567890",
      customerAddress: "123 Main St, City, Country",
      customerNotes: "VIP Customer",
      customerSource: "order",
    });
    
    sheet.getCell("F2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"order,consultation,material_request,website,referral,other"'],
    };
    
    this.addBordersToSheet(sheet);
  }



  private createOrdersTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Orders");
    sheet.columns = [
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Product Code", key: "productCode", width: 20 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Order Quantity", key: "orderQuantity", width: 15 },
      { header: "Order Discount", key: "orderDiscount", width: 18 },
      { header: "Order Status", key: "orderStatus", width: 15 },
    ];
    
    this.styleSheetHeader(sheet, "FF28A745");
    
    sheet.addRow({
      customerEmail: "john.doe@example.com",
      productCode: "NACL001",
      quantity: 10,
      orderQuantity: 10,
      orderDiscount: 5,
      orderStatus: "pending",
    });
    
    sheet.getCell("F2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"pending,shipped,delivered,cancelled"'],
    };
    
    this.addBordersToSheet(sheet);
  }

  private createMaterialRequestsTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Material Requests");
    sheet.columns = [
      { header: "Material Name", key: "materialName", width: 30 },
      { header: "Material Email", key: "materialEmail", width: 30 },
      { header: "Material Phone", key: "materialPhone", width: 20 },
      { header: "Material Quantity", key: "materialQuantity", width: 15 },
      { header: "Material Intended Use", key: "materialIntendedUse", width: 40 },
      { header: "Material Actions", key: "materialActions", width: 20 },
    ];
    
    this.styleSheetHeader(sheet, "FF17A2B8");
    
    sheet.addRow({
      materialName: "Sulfuric Acid",
      materialEmail: "customer@example.com",
      materialPhone: "+1234567890",
      materialQuantity: "5 liters",
      materialIntendedUse: "Laboratory research and testing",
      materialActions: "pending",
    });
    
    sheet.getCell("F2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"pending,approve,denied"'],
    };
    
    this.addBordersToSheet(sheet);
  }

  private createConsultationRequestsTemplateSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet("Consultation Requests");
    sheet.columns = [
      { header: "Consultation Name", key: "requestName", width: 25 },
      { header: "Consultation Email", key: "email", width: 30 },
      { header: "Consultation Phone", key: "phone", width: 20 },
      { header: "Consultation Area", key: "area", width: 25 },
      { header: "Consultation Message", key: "message", width: 50 },
      { header: "Consultation Status", key: "status", width: 15 },
    ];

    this.styleSheetHeader(sheet, "FF6610F2");

    sheet.addRow({
      requestName: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+1987654321",
      area: "Chemical Analysis",
      message: "I need consultation regarding chemical analysis procedures for my research project.",
      status: "new",
    });

    sheet.getCell("F2").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"new,contacted,closed"'],
    };

    this.addBordersToSheet(sheet);
  }


}
