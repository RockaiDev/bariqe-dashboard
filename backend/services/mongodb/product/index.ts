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
    const {
      perPage,
      page,
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

  // ✅ Export Products
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
          select: 'categoryNameAr categoryNameEn'
        });
      }

      const exportData = result.data.map((product: any) => {
        let categoryNameEn = '';
        let categoryNameAr = '';
        
        if (product.productCategory && typeof product.productCategory === 'object') {
          categoryNameEn = product.productCategory.categoryNameEn || '';
          categoryNameAr = product.productCategory.categoryNameAr || '';
        }

        let optionsText = '';
        if (product.productOptions && product.productOptions.length > 0) {
          optionsText = product.productOptions.map((opt: any) => 
            `${opt.name} (${opt.price} SAR)`
          ).join('; ');
        }

        return {
          NameAr: product.productNameAr || "",
          NameEn: product.productNameEn || "",
          DescriptionAr: product.productDescriptionAr || "",
          DescriptionEn: product.productDescriptionEn || "",
          Price: product.productPrice || 0,
          Amount: product.amount || 0,
          CategoryEn: categoryNameEn,
          CategoryAr: categoryNameAr,
          MoreSale: product.productMoreSale ? "Yes" : "No",
          Discount: product.productDiscount || "",
          Options: optionsText,
          CreatedAt: product.createdAt ? new Date(product.createdAt).toISOString().split('T')[0] : ""
        }; 
      });

      return exportData;
    } catch (error) {
      console.error('Export products error:', error);
      throw error;
    }
  }

  // ✅ Import Products
  public async ImportProducts(productsData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[]
      };

      for (const productData of productsData) {
        try {
          const identifier = productData.productNameEn || productData.productNameAr || "Unknown";

          let categoryId = null;
          if (productData.categoryNameEn || productData.categoryNameAr) {
            const category = await CategoryModel.findOne({
              $or: [
                { categoryNameEn: productData.categoryNameEn },
                { categoryNameAr: productData.categoryNameAr }
              ]
            });
            if (category) categoryId = category._id;
          }

          if (!categoryId) {
            results.failed.push({
              identifier,
              error: "Category not found or missing"
            });
            continue;
          }

          const productToSave = {
            productNameAr: productData.productNameAr,
            productNameEn: productData.productNameEn,
            productDescriptionAr: productData.productDescriptionAr,
            productDescriptionEn: productData.productDescriptionEn,
            productPrice: Number(productData.productPrice),
            amount: Number(productData.amount) || 0,
            productCategory: categoryId,
            productMoreSale: productData.productMoreSale === 'Yes' || productData.productMoreSale === true,
            productDiscount: productData.productDiscount || "Offer 20%",
            productOptions: [] 
          };

          const existingProduct = await ProductModel.findOne({ 
            productNameEn: productToSave.productNameEn 
          });

          if (existingProduct) {
            await ProductModel.findByIdAndUpdate(existingProduct._id, productToSave);
            results.updated.push(identifier);
          } else {
            await ProductModel.create(productToSave);
            results.success.push(identifier);
          }

        } catch (error: any) {
          results.failed.push({
            identifier: productData.productNameEn || "Unknown",
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