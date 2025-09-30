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
      "categoryImage",
      "categoryPublicId",
      "subCategories",
    ];
  }

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

  // 🟢 Get all categories with pagination & sorting
  public async GetCategories(query: any) {
    const keys = this.keys.sort();
    const {
      perPage = 10,
      page = 1,
      sorts = [],
      queries = [],
      includeSubCategories = true,
    } = pick(query, ["perPage", "page", "sorts", "queries", "includeSubCategories"]);

    // إصلاح: إزالة projection من PaginateHandler واستخدام أسلوب مختلف
    const result = await super.PaginateHandler(
      CategoryModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    // تطبيق projection يدوياً إذا لم تكن الـ subcategories مطلوبة
    if (includeSubCategories === 'false' && result.data) {
      result.data = result.data.map((category: any) => {
        const categoryObj = category.toObject ? category.toObject() : category;
        delete categoryObj.subCategories;
        return categoryObj;
      });
    }

    return { result, keys };
  }

  // 🟢 Get one category by ID
  public async GetOneCategory(id: string, includeSubCategories: boolean = true) {
    const projection = includeSubCategories ? {} : { subCategories: 0 };
    const category = await CategoryModel.findById(id, projection);
    if (!category) throw new ApiError("NOT_FOUND", "Category not found");
    return category;
  }

  // 🟢 Add new category
  public async AddCategory(body: any) {
    if (!body.categoryNameAr || !body.categoryNameEn) {
      throw new ApiError(
        "BAD_REQUEST",
        "Fields 'categoryNameAr' and 'categoryNameEn' are required"
      );
    }

    // Check if category already exists (case-insensitive)
    const existingCategory = await CategoryModel.findOne({
      $or: [
        { categoryNameEn: new RegExp(`^${body.categoryNameEn}$`, 'i') },
        { categoryNameAr: new RegExp(`^${body.categoryNameAr}$`, 'i') },
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
      const existingCategory = await CategoryModel.findOne({
        $or: [
          body.categoryNameEn ? { categoryNameEn: new RegExp(`^${body.categoryNameEn}$`, 'i') } : null,
          body.categoryNameAr ? { categoryNameAr: new RegExp(`^${body.categoryNameAr}$`, 'i') } : null,
        ].filter(Boolean),
        _id: { $ne: id },
      });
      
      if (existingCategory) {
        throw new ApiError("CONFLICT", "Category name already exists");
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

  // 🟢 SubCategory Management
  public async AddSubCategory(categoryId: string, subCategoryData: any) {
    if (!subCategoryData.subCategoryNameAr || !subCategoryData.subCategoryNameEn) {
      throw new ApiError("BAD_REQUEST", "Sub-category names in both languages are required");
    }

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw new ApiError("NOT_FOUND", "Category not found");
    }

    // Check if subcategory already exists in this category
    const existingSubCategory = category.subCategories.find((sub: any) => 
      sub.subCategoryNameEn.toLowerCase() === subCategoryData.subCategoryNameEn.toLowerCase() ||
      sub.subCategoryNameAr.toLowerCase() === subCategoryData.subCategoryNameAr.toLowerCase()
    );

    if (existingSubCategory) {
      throw new ApiError("CONFLICT", "Sub-category with the same name already exists in this category");
    }

    category.subCategories.push(subCategoryData);
    await category.save();
    
    return category;
  }

  public async EditSubCategory(categoryId: string, subCategoryId: string, updateData: any) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw new ApiError("NOT_FOUND", "Category not found");
    }

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) {
      throw new ApiError("NOT_FOUND", "Sub-category not found");
    }

    // Check for duplicate names if name is being updated
    if (updateData.subCategoryNameAr || updateData.subCategoryNameEn) {
      const duplicateSubCategory = category.subCategories.find((sub: any) => 
        sub._id.toString() !== subCategoryId && (
          (updateData.subCategoryNameEn && sub.subCategoryNameEn.toLowerCase() === updateData.subCategoryNameEn.toLowerCase()) ||
          (updateData.subCategoryNameAr && sub.subCategoryNameAr.toLowerCase() === updateData.subCategoryNameAr.toLowerCase())
        )
      );

      if (duplicateSubCategory) {
        throw new ApiError("CONFLICT", "Sub-category with the same name already exists in this category");
      }
    }

    Object.assign(subCategory, updateData);
    await category.save();
    
    return category;
  }

  public async DeleteSubCategory(categoryId: string, subCategoryId: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw new ApiError("NOT_FOUND", "Category not found");
    }

    const subCategory = category.subCategories.id(subCategoryId);
    if (!subCategory) {
      throw new ApiError("NOT_FOUND", "Sub-category not found");
    }

    category.subCategories.pull(subCategoryId);
    await category.save();
    
    return category;
  }

public async ExportCategories(filters?: any) {
  try {
    let query = {};

    if (filters?.queries && Array.isArray(filters.queries) && filters.queries.length > 0) {
      query = { $and: filters.queries };
    }

    const categories = await CategoryModel.find(query);

    const exportData = categories.map((category: any) => {
      // ✅ تحضير معلومات SubCategories للإكسبورت والإمبورت
      const subCategoriesForImport = category.subCategories?.map((sub: any) => ({
        nameEn: sub.subCategoryNameEn,
        nameAr: sub.subCategoryNameAr,
        status: sub.subCategoryStatus !== false
      })) || [];

      return {
        // ✅ بيانات للإمبورت المباشر
        categoryNameAr: category.categoryNameAr,
        categoryNameEn: category.categoryNameEn,
        categoryDescriptionAr: category.categoryDescriptionAr || "",
        categoryDescriptionEn: category.categoryDescriptionEn || "",
        categoryStatus: category.categoryStatus ? "Active" : "Inactive",
        categoryImage: category.categoryImage || "",
        subCategoriesData: JSON.stringify(subCategoriesForImport),
        
        // ✅ بيانات إضافية للعرض
        categoryId: category._id,
        subCategoriesCount: subCategoriesForImport.length,
        subCategoriesNames: subCategoriesForImport.map(sub => `${sub.nameEn} | ${sub.nameAr}`).join("; "),
        createdAt: category.createdAt?.toISOString() || "",
        updatedAt: category.updatedAt?.toISOString() || "",
      };
    });

    return exportData;
  } catch (error) {
    console.error("❌ Export categories error:", error);
    throw new ApiError("INTERNAL_SERVER_ERROR", "Error exporting categories");
  }
}



// في ملف src/services/mongodb/category.ts

public async ImportCategories(categoriesData: any[]) {
  try {
    console.log("🔄 Starting import for", categoriesData.length, "categories");

    const results = {
      success: [] as string[],
      failed: [] as any[],
      updated: [] as string[],
      skipped: [] as string[],
    };

    for (let i = 0; i < categoriesData.length; i++) {
      const categoryData = categoriesData[i];
      try {
        console.log(`\n🔄 Processing category ${i + 1}/${categoriesData.length}:`);
        console.log(`   Input English: "${categoryData.categoryNameEn}"`);
        console.log(`   Input Arabic: "${categoryData.categoryNameAr}"`);

        // التحقق من البيانات المطلوبة
        if (!categoryData.categoryNameAr?.trim() || !categoryData.categoryNameEn?.trim()) {
          console.log("❌ Missing required fields");
          results.failed.push({
            categoryName: categoryData.categoryNameEn || categoryData.categoryNameAr || "UNKNOWN",
            error: "Missing required fields",
          });
          continue;
        }

        // ✅ تحضير SubCategories الجديدة إذا كانت موجودة
        let newSubCategories = [];
        if (categoryData.subCategoriesData && typeof categoryData.subCategoriesData === 'string') {
          try {
            const parsedSubCategories = JSON.parse(categoryData.subCategoriesData);
            newSubCategories = parsedSubCategories.filter((sub: any) => 
              sub.nameEn?.trim() && sub.nameAr?.trim()
            ).map((sub: any) => ({
              subCategoryNameEn: sub.nameEn.trim(),
              subCategoryNameAr: sub.nameAr.trim(),
              subCategoryStatus: sub.status !== false
            }));
          } catch (parseError) {
            console.log("⚠️ Could not parse subcategories data, continuing without them");
          }
        }

        // تحضير البيانات الأساسية للـ category
        const categoryToSave = {
          categoryNameAr: categoryData.categoryNameAr.trim(),
          categoryNameEn: categoryData.categoryNameEn.trim(),
          categoryDescriptionAr: categoryData.categoryDescriptionAr?.trim() || "",
          categoryDescriptionEn: categoryData.categoryDescriptionEn?.trim() || "",
          categoryStatus: String(categoryData.categoryStatus || "Active").toLowerCase() === "active",
          categoryImage: categoryData.categoryImage || null,
        };

        console.log("💾 Prepared data:", {
          nameEn: categoryToSave.categoryNameEn,
          nameAr: categoryToSave.categoryNameAr,
          status: categoryToSave.categoryStatus,
          hasImage: !!categoryToSave.categoryImage,
          newSubCategoriesCount: newSubCategories.length
        });

        // البحث عن فئة موجودة
        const existingCategory = await CategoryModel.findOne({
          $or: [
            { categoryNameEn: new RegExp(`^${categoryToSave.categoryNameEn}$`, 'i') },
            { categoryNameAr: new RegExp(`^${categoryToSave.categoryNameAr}$`, 'i') },
          ],
        });

        if (existingCategory) {
          console.log("🔍 Found existing category:", existingCategory._id);
          
          // ✅ دمج الـ SubCategories بدلاً من الاستبدال
          let finalSubCategories = [...(existingCategory.subCategories || [])];
          let addedSubCategories = 0;
          let skippedSubCategories = 0;

          // إضافة الـ subcategories الجديدة فقط إذا لم تكن موجودة
          for (const newSub of newSubCategories) {
            const existingSubIndex = finalSubCategories.findIndex((existingSub: any) => 
              existingSub.subCategoryNameEn.toLowerCase() === newSub.subCategoryNameEn.toLowerCase() ||
              existingSub.subCategoryNameAr.toLowerCase() === newSub.subCategoryNameAr.toLowerCase()
            );

            if (existingSubIndex === -1) {
              // SubCategory جديدة - أضفها
              finalSubCategories.push(newSub);
              addedSubCategories++;
              console.log(`   ➕ Added new subcategory: ${newSub.subCategoryNameEn}`);
            } else {
              // SubCategory موجودة - تخطاها
              skippedSubCategories++;
              console.log(`   ⏭️ Skipped existing subcategory: ${newSub.subCategoryNameEn}`);
            }
          }

          // ✅ التحقق من وجود تغييرات في البيانات الأساسية أو SubCategories
          const hasBasicChanges = (
            existingCategory.categoryNameAr !== categoryToSave.categoryNameAr ||
            existingCategory.categoryNameEn !== categoryToSave.categoryNameEn ||
            existingCategory.categoryDescriptionAr !== categoryToSave.categoryDescriptionAr ||
            existingCategory.categoryDescriptionEn !== categoryToSave.categoryDescriptionEn ||
            existingCategory.categoryStatus !== categoryToSave.categoryStatus ||
            existingCategory.categoryImage !== categoryToSave.categoryImage
          );

          const hasSubCategoriesChanges = addedSubCategories > 0;

          if (hasBasicChanges || hasSubCategoriesChanges) {
            console.log("📝 Changes detected, updating category");
            console.log(`   Basic changes: ${hasBasicChanges ? 'Yes' : 'No'}`);
            console.log(`   SubCategories added: ${addedSubCategories}`);
            console.log(`   SubCategories skipped: ${skippedSubCategories}`);
            
            const updatedCategory = await CategoryModel.findByIdAndUpdate(
              existingCategory._id,
              {
                ...categoryToSave,
                subCategories: finalSubCategories
              },
              { new: true, runValidators: true }
            );

            if (updatedCategory) {
              results.updated.push(`${categoryData.categoryNameEn} (${addedSubCategories} subcategories added, ${skippedSubCategories} skipped)`);
              console.log("✅ Successfully updated");
            } else {
              throw new Error("Failed to update category");
            }
          } else {
            console.log("⏭️ No changes detected, skipping");
            results.skipped.push(`${categoryData.categoryNameEn} (${skippedSubCategories} subcategories already exist)`);
          }
        } else {
          console.log("➕ Creating new category");

          const newCategory = new CategoryModel({
            ...categoryToSave,
            subCategories: newSubCategories
          });
          const savedCategory = await newCategory.save();

          if (savedCategory) {
            results.success.push(`${categoryData.categoryNameEn} (${newSubCategories.length} subcategories)`);
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
          categoryName: categoryData.categoryNameEn || categoryData.categoryNameAr || "UNKNOWN",
          error: errorMessage,
        });
      }
    }

    const summary = {
      total: categoriesData.length,
      success: results.success.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
    };

    console.log("📊 Final Summary:", summary);
    return { categories: results, summary };
  } catch (error) {
    console.error("❌ Import service error:", error);
    throw new ApiError("INTERNAL_SERVER_ERROR", "Error importing categories");
  }
}

  // 🟢 Get categories with active status
  public async GetActiveCategories(includeSubCategories: boolean = true) {
    const projection = includeSubCategories ? {} : { subCategories: 0 };
    return await CategoryModel.find({ categoryStatus: true }, projection);
  }

  // 🟢 Get category statistics
  public async GetCategoryStats() {
    try {
      const stats = await CategoryModel.aggregate([
        {
          $group: {
            _id: null,
            totalCategories: { $sum: 1 },
            activeCategories: {
              $sum: { $cond: [{ $eq: ["$categoryStatus", true] }, 1, 0] }
            },
            inactiveCategories: {
              $sum: { $cond: [{ $eq: ["$categoryStatus", false] }, 1, 0] }
            },
            totalSubCategories: { $sum: { $size: "$subCategories" } },
            categoriesWithImages: {
              $sum: { $cond: [{ $ne: ["$categoryImage", null] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalCategories: 0,
        activeCategories: 0,
        inactiveCategories: 0,
        totalSubCategories: 0,
        categoriesWithImages: 0
      };
    } catch (error) {
      console.error("Stats error:", error);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error getting category statistics");
    }
  }
}