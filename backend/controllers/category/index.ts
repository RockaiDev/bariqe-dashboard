// src/controllers/category/index.ts
import { Request, Response, NextFunction } from "express";
import CategoryService from "../../services/mongodb/category";
import BaseApi from "../../utils/BaseApi";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "../../utils/errors/ApiError";

// 📂 Configure multer for Excel upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      return cb(new ApiError("BAD_REQUEST", "Only Excel files are allowed"));
    }
    cb(null, true);
  },
});

const categoryService = new CategoryService();

export default class CategoryController extends BaseApi {
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

  // 🟢 Add category
  public async addCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.AddCategory(req.body);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Edit category
  public async editCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.EditOneCategory(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Delete category
  public async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.DeleteOneCategory(req.params.id);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export categories to Excel
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

      sheet.columns = [
        { header: "Category Name", key: "categoryName", width: 30 },
        { header: "Description", key: "categoryDescription", width: 50 },
        { header: "Status", key: "categoryStatus", width: 15 },
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

  // 🟢 Download import template
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
      sheet.columns = [
        { header: "Category Name", key: "categoryName", width: 30 },
        { header: "Description", key: "categoryDescription", width: 50 },
        { header: "Status", key: "categoryStatus", width: 15 },
      ];
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      sheet.addRow({
        categoryName: "Sample Category",
        categoryDescription: "Example category description",
        categoryStatus: "Active",
      });
      sheet.addRow({
        categoryName: "Another Category",
        categoryDescription: "Another sample category",
        categoryStatus: "Inactive",
      });

      const instructions = workbook.addWorksheet("Instructions");
      instructions.addRow(["How to use this template:"]);
      instructions.addRow([
        "1. Do not modify headers. 2. Fill required fields. 3. Status must be Active/Inactive.",
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

  // 🟢 Import categories
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
          const name = String(row.getCell(1).value || "").trim();
          const desc = String(row.getCell(2).value || "").trim();
          const status = String(row.getCell(3).value || "Active").trim();

          if (!name || !desc) return;
          if (!["Active", "Inactive"].includes(status)) {
            throw new ApiError("BAD_REQUEST", `Row ${rowNum}: Invalid status`);
          }

          categoriesData.push({
            categoryName: name,
            categoryDescription: desc,
            categoryStatus: status,
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
