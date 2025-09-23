// src/services/mongodb/category.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import CategoryModel from "../../../models/categorySchema";
import { pick } from "lodash";

export default class CategoryService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = ["categoryName", "categoryDescription", "categoryStatus"];
  }

  // 🟢 Get all categories with pagination & sorting
  public async GetCategories(query: any) {
    const keys = this.keys.sort();
    const { perPage = 10, page = 1, sorts = [], queries = [] } = pick(query, [
      "perPage",
      "page",
      "sorts",
      "queries",
    ]);

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
    if (!body.categoryName || !body.categoryDescription) {
      throw new ApiError(
        "BAD_REQUEST",
        "Fields 'categoryName' and 'categoryDescription' are required"
      );
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await CategoryModel.findOne({
      categoryName: { $regex: new RegExp(`^${body.categoryName}$`, "i") },
    });

    if (existingCategory) {
      throw new ApiError("CONFLICT", "Category with the same name already exists");
    }

    const newCategory = pick(body, this.keys);
    return await super.addDocument(CategoryModel, newCategory);
  }

  // 🟢 Edit category
  public async EditOneCategory(id: string, body: any) {
    // If category name is being changed, check for duplicates
    if (body.categoryName) {
      const existingCategory = await CategoryModel.findOne({
        categoryName: { $regex: new RegExp(`^${body.categoryName}$`, "i") },
        _id: { $ne: id },
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
    if (!result) throw new ApiError("NOT_FOUND", `Category with id ${id} not found`);
    return result;
  }

  // 🟢 Export categories to Excel-friendly format
  public async ExportCategories(filters?: any) {
    try {
      let query = {};

      if (filters?.queries && Array.isArray(filters.queries) && filters.queries.length > 0) {
        query = { $and: filters.queries };
      }

      const categories = await CategoryModel.find(query);

      const exportData = categories.map((category: any) => ({
        categoryName: category.categoryName,
        categoryDescription: category.categoryDescription,
        categoryStatus: category.categoryStatus ? "Active" : "Inactive",
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
      console.log("🔄 Starting import for", categoriesData.length, "categories");

      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[],
      };

      for (const categoryData of categoriesData) {
        try {
          if (!categoryData.categoryName || !categoryData.categoryDescription) {
            results.failed.push({
              categoryName: categoryData.categoryName || "UNKNOWN",
              error: "Missing required fields: categoryName or categoryDescription",
            });
            continue;
          }

          // Check if category exists (case-insensitive)
          const existingCategory = await CategoryModel.findOne({
            categoryName: { $regex: new RegExp(`^${categoryData.categoryName}$`, "i") },
          });

          const categoryToSave = {
            categoryName: categoryData.categoryName.trim(),
            categoryDescription: categoryData.categoryDescription.trim(),
            categoryStatus:
              String(categoryData.categoryStatus).toLowerCase() === "active",
          };

          if (existingCategory) {
            // Update
            const updatedCategory = await CategoryModel.findByIdAndUpdate(
              existingCategory._id,
              categoryToSave,
              { new: true, runValidators: true }
            );
            if (updatedCategory) {
              results.updated.push(categoryData.categoryName);
            } else {
              throw new Error("Failed to update category");
            }
          } else {
            // Create
            const newCategory = await CategoryModel.create(categoryToSave);
            if (newCategory) {
              results.success.push(categoryData.categoryName);
            } else {
              throw new Error("Failed to create category");
            }
          }
        } catch (error: any) {
          results.failed.push({
            categoryName: categoryData.categoryName || "UNKNOWN",
            error: error.message || "Unknown error occurred",
          });
        }
      }

      const summary = {
        total: categoriesData.length,
        success: results.success.length,
        updated: results.updated.length,
        failed: results.failed.length,
      };

      console.log("📊 Import completed. Summary:", summary);

      return { categories: results, summary };
    } catch (error) {
      console.error("❌ Import service error:", error);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error importing categories");
    }
  }
}
