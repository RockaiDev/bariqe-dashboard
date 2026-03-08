// ProductService.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import ProductModel from "../../../models/productSchema";
import CategoryModel from "../../../models/categorySchema";
import { pick } from 'lodash';

export default class ProductService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    // ✅ المفاتيح المطابقة للـ Schema الجديدة
    this.keys = [
      "productNameAr",
      "productNameEn",
      "productDescriptionAr",
      "productDescriptionEn",
      "productOldPrice",
      "productNewPrice",
      "productCategory",
      "productImage",
      "productImagePublicId",
      "productMoreSale",
      "amount",
      "productDiscount",
      "productOptions"
    ];
  }

  // 🟢 Get all products with pagination & sorting
  public async GetProducts(query: any) {
    let {
      perPage,
      page,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    // Default sort by createdAt desc if no sort provided
    if (
      !sorts ||
      sorts === "[]" ||
      (Array.isArray(sorts) && sorts.length === 0)
    ) {
      sorts = [["createdAt", "desc"]];
    }

    const result = await super.PaginateHandler(
      ProductModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    if (result.data && result.data.length > 0) {
      await ProductModel.populate(result.data, {
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus'
      });
    }

    return { result, keys: this.keys };
  }

  // 🟢 Get one product by ID
  public async GetOneProduct(id: string) {
    try {
      const product = await ProductModel.findById(id).populate({
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus'
      });

      if (!product) throw new ApiError("NOT_FOUND", "Product not found");

      return product;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Add new product
  public async AddProduct(body: any) {
    try {
      // Map productPrice to productOldPrice if productOldPrice is not provided
      // Also convert to number if it's a string (FormData sends strings)
      if (body.productPrice && !body.productOldPrice) {
        body.productOldPrice = typeof body.productPrice === 'string'
          ? parseFloat(body.productPrice)
          : body.productPrice;
      }

      // التحقق من الحقول الأساسية
      if (!body.productNameAr || !body.productNameEn || !body.productDescriptionAr ||
        !body.productDescriptionEn || !body.productOldPrice || !body.productCategory) {
        throw new ApiError(
          "BAD_REQUEST",
          "Required fields missing: Name, Description, Price, or Category."
        );
      }

      // التحقق من وجود القسم
      const categoryExists = await CategoryModel.findById(body.productCategory);
      if (!categoryExists) {
        throw new ApiError("BAD_REQUEST", "Invalid Category ID");
      }

      const newProductData = pick(body, this.keys);

      // معالجة productOptions
      if (newProductData.productOptions && typeof newProductData.productOptions === 'string') {
        try {
          newProductData.productOptions = JSON.parse(newProductData.productOptions);
        } catch (error) {
          throw new ApiError("BAD_REQUEST", "Invalid JSON format for productOptions");
        }
      }

      const product = await super.addDocument(ProductModel, newProductData);

      await product.populate({
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus'
      });

      return product;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'ValidationError') {
        throw new ApiError("BAD_REQUEST", error.message);
      }
      throw error;
    }
  }

  // 🟢 Edit product
  public async EditOneProduct(id: string, body: any) {
    try {
      // Map productPrice to productOldPrice if productOldPrice is not provided
      // Also convert to number if it's a string (FormData sends strings)
      if (body.productPrice && !body.productOldPrice) {
        body.productOldPrice = typeof body.productPrice === 'string'
          ? parseFloat(body.productPrice)
          : body.productPrice;
      }

      const updateData = pick(body, this.keys);

      // التحقق من القسم إذا تم إرساله
      if (updateData.productCategory) {
        const categoryExists = await CategoryModel.findById(updateData.productCategory);
        if (!categoryExists) {
          throw new ApiError("BAD_REQUEST", "Invalid Category ID");
        }
      }

      // معالجة productOptions
      if (updateData.productOptions && typeof updateData.productOptions === 'string') {
        try {
          updateData.productOptions = JSON.parse(updateData.productOptions);
        } catch (error) {
          throw new ApiError("BAD_REQUEST", "Invalid JSON format for productOptions");
        }
      }

      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate({
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus'
      });

      if (!updatedProduct) {
        throw new ApiError("NOT_FOUND", `Product with id ${id} not found`);
      }

      return updatedProduct;

    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'CastError') {
        throw new ApiError("BAD_REQUEST", `Invalid Product ID format`);
      }
      if (error.name === 'ValidationError') {
        throw new ApiError("BAD_REQUEST", `Validation Error: ${error.message}`);
      }
      console.error("EditOneProduct Error:", error);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error updating product");
    }
  }

  // 🟢 Delete product
  public async DeleteOneProduct(id: string) {
    try {
      const result = await super.deleteDocument(ProductModel, id);
      if (!result) {
        throw new ApiError("NOT_FOUND", `Product with id ${id} not found`);
      }
      return result;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("INTERNAL_SERVER_ERROR", `Failed to delete product: ${error.message}`);
    }
  }

  // 🟢 Get SubCategories (Helper)
  public async GetSubCategoriesByCategory(categoryId: string) {
    try {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        throw new ApiError("NOT_FOUND", "Category not found");
      }
      return category.subCategories || [];
    } catch (error) {
      throw error;
    }
  }

  // ✅ Export Products — field names match controller Excel column keys exactly
  public async ExportProducts(query?: any) {
    try {
      const {
        perPage = 999999,
        page = 1,
        sorts = [],
        queries = [],
      } = pick(query, ["perPage", "page", "sorts", "queries"]);

      const result = await super.PaginateHandler(
        ProductModel,
        Number(perPage),
        Number(page),
        sorts,
        queries
      );

      if (result.data && result.data.length > 0) {
        await ProductModel.populate(result.data, {
          path: 'productCategory',
          select: 'categoryNameAr categoryNameEn subCategories'
        });
      }

      const exportData = result.data.map((product: any) => {
        let categoryNameEn = '';
        let categoryNameAr = '';
        let subCategoryNameEn = '';
        let subCategoryNameAr = '';

        if (product.productCategory && typeof product.productCategory === 'object') {
          categoryNameEn = product.productCategory.categoryNameEn || '';
          categoryNameAr = product.productCategory.categoryNameAr || '';

          // Resolve subCategory if product has a subCategory reference
          if (product.productSubCategory && product.productCategory.subCategories) {
            const subCat = product.productCategory.subCategories.find(
              (sc: any) => sc._id?.toString() === product.productSubCategory?.toString()
            );
            if (subCat) {
              subCategoryNameEn = subCat.subCategoryNameEn || '';
              subCategoryNameAr = subCat.subCategoryNameAr || '';
            }
          }
        }

        return {
          productCode: product.productCode || product._id?.toString().substring(0, 6) || "",
          productNameAr: product.productNameAr || "",
          productNameEn: product.productNameEn || "",
          productDescriptionAr: product.productDescriptionAr || "",
          productDescriptionEn: product.productDescriptionEn || "",
          productPrice: product.productOldPrice || product.productNewPrice || 0,
          categoryNameEn: categoryNameEn,
          categoryNameAr: categoryNameAr,
          subCategoryNameEn: subCategoryNameEn,
          subCategoryNameAr: subCategoryNameAr,
          productForm: product.productForm || "Solid",
          productStatus: product.productMoreSale !== undefined ? product.productMoreSale : true,
          productDiscount: product.productDiscount || "",
        };
      });

      return exportData;
    } catch (error) {
      console.error('Export products error:', error);
      throw error;
    }
  }

  // ✅ Import Products — maps Excel fields to the actual Schema fields
  public async ImportProducts(productsData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[]
      };

      for (const productData of productsData) {
        try {
          const identifier = productData.productCode || productData.productNameEn || productData.productNameAr || "Unknown";

          // --- Resolve Category ---
          let categoryId = null;
          let categoryDoc: any = null;
          if (productData.categoryNameEn || productData.categoryNameAr) {
            categoryDoc = await CategoryModel.findOne({
              $or: [
                ...(productData.categoryNameEn ? [{ categoryNameEn: productData.categoryNameEn }] : []),
                ...(productData.categoryNameAr ? [{ categoryNameAr: productData.categoryNameAr }] : []),
              ]
            });
            if (categoryDoc) categoryId = categoryDoc._id;
          }

          if (!categoryId) {
            results.failed.push({
              identifier,
              error: `Category not found: "${productData.categoryNameEn || productData.categoryNameAr}"`
            });
            continue;
          }

          // --- Resolve SubCategory (optional but validated when provided) ---
          let subCategoryId = null;
          if (productData.subCategoryNameEn || productData.subCategoryNameAr) {
            if (categoryDoc && categoryDoc.subCategories && categoryDoc.subCategories.length > 0) {
              const subCat = categoryDoc.subCategories.find((sc: any) => {
                if (productData.subCategoryNameEn && sc.subCategoryNameEn === productData.subCategoryNameEn) return true;
                if (productData.subCategoryNameAr && sc.subCategoryNameAr === productData.subCategoryNameAr) return true;
                return false;
              });
              if (subCat) {
                subCategoryId = subCat._id;
              } else {
                results.failed.push({
                  identifier,
                  error: `SubCategory "${productData.subCategoryNameEn || productData.subCategoryNameAr}" not found in category "${productData.categoryNameEn || productData.categoryNameAr}"`
                });
                continue;
              }
            }
          }

          // --- Map Excel fields → Schema fields ---
          const productToSave: any = {
            productNameAr: productData.productNameAr,
            productNameEn: productData.productNameEn,
            productDescriptionAr: productData.productDescriptionAr,
            productDescriptionEn: productData.productDescriptionEn,
            productOldPrice: Number(productData.productPrice) || 0,
            productCategory: categoryId,
            productDiscount: productData.productDiscount || "Offer 20%",
            productMoreSale: productData.productStatus === 'Active' || productData.productStatus === true,
          };

          // Set productCode if provided
          if (productData.productCode) {
            productToSave.productCode = productData.productCode;
          }

          // Set subCategory if resolved
          if (subCategoryId) {
            productToSave.productSubCategory = subCategoryId;
          }

          // Set productForm if provided
          if (productData.productForm) {
            productToSave.productForm = productData.productForm;
          }

          // --- Upsert: update if exists (by productCode or productNameEn), else create ---
          let existingProduct = null;
          if (productData.productCode) {
            existingProduct = await ProductModel.findOne({ productCode: productData.productCode });
          }
          if (!existingProduct && productToSave.productNameEn) {
            existingProduct = await ProductModel.findOne({ productNameEn: productToSave.productNameEn });
          }

          if (existingProduct) {
            await ProductModel.findByIdAndUpdate(existingProduct._id, productToSave, { runValidators: true });
            results.updated.push(identifier);
          } else {
            await ProductModel.create(productToSave);
            results.success.push(identifier);
          }

        } catch (error: any) {
          results.failed.push({
            identifier: productData.productCode || productData.productNameEn || "Unknown",
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  /* =========================================================================
     🛑 Legacy Methods Restoration (لإصلاح أخطاء الـ Controller)
     تمت إعادتهم لضمان عدم توقف المشروع، لكن تم تفريغ المنطق لأن الـ Schema تغيرت
     ========================================================================= */

  // ✅ Export Categories (ما زالت مفيدة)
  public async ExportCategories(queryParams?: any) {
    try {
      const categories = await CategoryModel.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "productCategory",
            as: "products"
          }
        },
        {
          $addFields: {
            productsCount: { $size: "$products" },
            subCategoriesCount: { $size: { $ifNull: ["$subCategories", []] } }
          }
        },
        {
          $project: {
            categoryNameAr: 1,
            categoryNameEn: 1,
            categoryStatus: 1,
            productsCount: 1,
            subCategoriesCount: 1,
            createdAt: 1
          }
        },
        { $sort: { categoryNameEn: 1 } }
      ]);
      return categories;
    } catch (error) {
      console.error("Error exporting categories:", error);
      throw new Error("Failed to export categories");
    }
  }

  // ⚠️ Export Discount Tiers (Stub - لأن الـ Schema لم تعد تدعم Tiers)
  public async ExportDiscountTiers(query?: any) {
    // إرجاع مصفوفة فارغة لتجنب الخطأ
    return [];
  }

  // ⚠️ Bulk Update Discount Tiers (Stub - غير مدعومة حالياً)
  public async BulkUpdateDiscountTiers(discountData: any[]) {
    // إرجاع نجاح وهمي لتجنب تحطم التطبيق
    return {
      success: [],
      failed: [{ error: "Discount Tiers are no longer supported in the new Schema." }]
    };
  }
}