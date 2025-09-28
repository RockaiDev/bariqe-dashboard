// src/services/mongodb/category.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import CategoryModel from "../../../models/categorySchema";
import { pick } from "lodash";

export default class CategoryService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "categoryNameAr",
      "categoryNameEn",
      "categoryDescriptionAr", 
      "categoryDescriptionEn",
      "categoryStatus",
      "categoryImage", // تصحيح الخطأ الإملائي
    ];
  }

  /**
   * Helper method to get existing category image safely
   */
  private getExistingCategoryImage(category: any): string | null {
    if (!category) return null;

    // Try different possible structures
    if (category.categoryImage) return category.categoryImage;
    if (category.data?.categoryImage) return category.data.categoryImage;
    if (category._doc?.categoryImage) return category._doc.categoryImage;

    return null;
  }

  // 🟢 Get all categories with pagination & sorting
  public async GetCategories(query: any) {
    const keys = this.keys.sort();
    const {
      perPage = 10,
      page = 1,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    const result = await super.PaginateHandler(
      CategoryModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    return { result, keys };
  }

  // 🟢 Get one category by ID
  public async GetOneCategory(id: string) {
    const category = await super.getDocument(CategoryModel, id);
    if (!category) throw new ApiError("NOT_FOUND", "Category not found");
    return category;
  }

  // 🟢 Add new category
  public async AddCategory(body: any) {
    if (!body.categoryNameAr || !body.categoryNameEn 
        ) {
      throw new ApiError(
        "BAD_REQUEST",
        "Fields 'categoryNameAr', 'categoryNameEn' are required"
      );
    }

    // Check if category already exists (case-insensitive)
    let existingCategory = await CategoryModel.findOne({
      $or: [
        { categoryNameEn: body.categoryNameEn },
        { categoryNameAr: body.categoryNameAr },
      ],
    });

    if (existingCategory) {
      throw new ApiError(
        "CONFLICT",
        "Category with the same name already exists"
      );
    }

    const newCategory = pick(body, this.keys);
    return await super.addDocument(CategoryModel, newCategory);
  }

  // 🟢 Edit category
  public async EditOneCategory(id: string, body: any) {
    // If category name is being changed, check for duplicates
    if (body.categoryNameAr || body.categoryNameEn) { 
      let existingCategory = await CategoryModel.findOne({
        $or: [
          { categoryNameEn: body.categoryNameEn },
          { categoryNameAr: body.categoryNameAr },
        ],
        _id: { $ne: id }, // Exclude the current category from the search
      });
      if (existingCategory) {
        throw new ApiError("BAD_REQUEST", "Category name already exists");
      }
    }

    const updateData = pick(body, this.keys);
    const updatedCategory = await CategoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      throw new ApiError("NOT_FOUND", `Category with id ${id} not found`);
    }

    return updatedCategory;
  }

  // 🟢 Delete category
  public async DeleteOneCategory(id: string) {
    const result = await super.deleteDocument(CategoryModel, id);
    if (!result)
      throw new ApiError("NOT_FOUND", `Category with id ${id} not found`);
    return result;
  }

  // 🟢 Export categories to Excel-friendly format
  public async ExportCategories(filters?: any) {
    try {
      let query = {};

      if (
        filters?.queries &&
        Array.isArray(filters.queries) &&
        filters.queries.length > 0
      ) {
        query = { $and: filters.queries };
      }

      const categories = await CategoryModel.find(query);

      const exportData = categories.map((category: any) => ({
        categoryNameAr: category.categoryNameAr,
        categoryNameEn: category.categoryNameEn,
        categoryDescriptionAr: category.categoryDescriptionAr,
        categoryDescriptionEn: category.categoryDescriptionEn,
        categoryStatus: category.categoryStatus ? "Active" : "Inactive",
        categoryImage: category.categoryImage || "",
        createdAt: category.createdAt?.toISOString() || "",
        updatedAt: category.updatedAt?.toISOString() || "",
      }));

      return exportData;
    } catch (error) {
      console.error("❌ Export categories error:", error);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error exporting categories");
    }
  }

  // 🟢 Import categories from Excel
  public async ImportCategories(categoriesData: any[]) {
    try {
      console.log(
        "🔄 Starting import for",
        categoriesData.length,
        "categories"
      );

      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[],
      };

      for (let i = 0; i < categoriesData.length; i++) {
        const categoryData = categoriesData[i];
        try {
          console.log(
            `\n🔄 Processing category ${i + 1}/${categoriesData.length}:`
          );
          console.log(`   Input English: "${categoryData.categoryNameEn}"`);
          console.log(`   Input Arabic: "${categoryData.categoryNameAr}"`);

          // التحقق من البيانات المطلوبة
          if (!categoryData.categoryNameAr?.trim() || !categoryData.categoryNameEn?.trim() ) {
            console.log("❌ Missing required fields");
            results.failed.push({
              categoryName: categoryData.categoryNameEn || categoryData.categoryNameAr || "UNKNOWN",
              error: "Missing required fields",
            });
            continue;
          }

          // تحضير البيانات للحفظ
          const categoryToSave = {
            categoryNameAr: categoryData.categoryNameAr.trim(),
            categoryNameEn: categoryData.categoryNameEn.trim(),
            categoryDescriptionAr: categoryData.categoryDescriptionAr.trim(),
            categoryDescriptionEn: categoryData.categoryDescriptionEn.trim(),
            categoryStatus:
              String(categoryData.categoryStatus || "Active").toLowerCase() ===
              "active",
            categoryImage: categoryData.categoryImage || null,
          };

          console.log("💾 Prepared data:", {
            nameEn: categoryToSave.categoryNameEn,
            nameAr: categoryToSave.categoryNameAr,
            status: categoryToSave.categoryStatus,
            hasImage: !!categoryToSave.categoryImage,
          });

          // البحث عن فئة موجودة
          let existingCategory = await CategoryModel.findOne({
            $or: [
              { categoryNameEn: categoryToSave.categoryNameEn },
              { categoryNameAr: categoryToSave.categoryNameAr },
            ],
          });

          if (existingCategory) {
            console.log("📝 Updating existing category:", existingCategory._id);
            
            const updatedCategory = await CategoryModel.findByIdAndUpdate(
              existingCategory._id,
              categoryToSave,
              {
                new: true,
                runValidators: true,
              }
            );

            if (updatedCategory) {
              results.updated.push(categoryData.categoryNameEn);
              console.log("✅ Successfully updated");
            } else {
              throw new Error("Failed to update category");
            }
          } else {
            console.log("➕ Creating new category");

            const newCategory = new CategoryModel(categoryToSave);
            const savedCategory = await newCategory.save();

            if (savedCategory) {
              results.success.push(categoryData.categoryNameEn);
              console.log("✅ Successfully created:", savedCategory._id);
            } else {
              throw new Error("Failed to create category");
            }
          }
        } catch (error: any) {
          console.error(`❌ Error processing category ${i + 1}:`, {
            error: error.message,
            code: error.code,
            categoryName: categoryData.categoryNameEn,
          });

          let errorMessage = error.message;

          if (error.code === 11000) {
            errorMessage = "Category name already exists (duplicate key)";
          }

          results.failed.push({
            categoryName:
              categoryData.categoryNameEn ||
              categoryData.categoryNameAr ||
              "UNKNOWN",
            error: errorMessage,
          });
        }
      }

      const summary = {
        total: categoriesData.length,
        success: results.success.length,
        updated: results.updated.length,
        failed: results.failed.length,
      };

      console.log("📊 Final Summary:", summary);
      return { categories: results, summary };
    } catch (error) {
      console.error("❌ Import service error:", error);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error importing categories");
    }
  }
}