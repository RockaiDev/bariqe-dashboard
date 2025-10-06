// ProductService.js
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import ProductModel from "../../../models/productSchema";
import CategoryModel from "../../../models/categorySchema";
import Category from "../../../models/categorySchema";
import { pick } from 'lodash';

export default class ProductService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    // Allowed fields in body
    this.keys = [
      "productNameAr",
      "productNameEn",
      "productDescriptionAr",
      "productDescriptionEn",
      "productPrice",
      "productCategory",
      "productSubCategory", // ✅ إضافة SubCategory
      "productImage",
      "productStatus",
      "productForm",
      "productDiscount",
      "productCode",
      "discountTiers"
    ];
  }

  // ✅ Helper function للحصول على معلومات SubCategory
  private async getSubCategoryInfo(categoryId: string, subCategoryId: string) {
    try {
      const category = await CategoryModel.findById(categoryId);
      if (!category || !category.subCategories) {
        return null;
      }
      
      const subCategory = category.subCategories.id(subCategoryId);
      return subCategory;
    } catch (error) {
      return null;
    }
  }

  // ✅ Helper function للتحقق من صحة SubCategory
  private async validateSubCategory(categoryId: string, subCategoryId: string) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      throw new ApiError("BAD_REQUEST", "Invalid category ID");
    }

    if (!category.subCategories || category.subCategories.length === 0) {
      throw new ApiError("BAD_REQUEST", "No subcategories found in this category");
    }

    const subCategoryExists = category.subCategories.some((sub: any) => 
      sub._id.toString() === subCategoryId.toString()
    );

    if (!subCategoryExists) {
      throw new ApiError("BAD_REQUEST", "SubCategory does not belong to the selected category");
    }

    return category.subCategories.id(subCategoryId);
  }

  // 🟢 Get all products with pagination & sorting
  public async GetProducts(query: any) {
    const keys = this.keys.sort();
    const {
      perPage,
      page,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    // Get paginated results first
    const result = await super.PaginateHandler(
      ProductModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    // ✅ Populate category مع SubCategories
    if (result.data && result.data.length > 0) {
      await ProductModel.populate(result.data, { 
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus subCategories'
      });
    }

    return { result, keys };
  }

  // 🟢 Get one product by ID
  public async GetOneProduct(id: string) {
    try {
      const product = await ProductModel.findById(id).populate({
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus subCategories'
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
      if (!body.productNameAr || !body.productNameEn || !body.productDescriptionAr || 
          !body.productDescriptionEn || !body.productPrice || !body.productCategory || 
          !body.productSubCategory || !body.productCode) { // ✅ إضافة التحقق من SubCategory
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'productNameAr', 'productNameEn', 'productDescriptionAr', 'productDescriptionEn', 'productCode', 'productPrice', 'productCategory', 'productSubCategory' are required"
        );
      }
      
      // Check if productCode exists
      const existingProduct = await ProductModel.findOne({ productCode: body.productCode });
      if (existingProduct) {
        throw new ApiError("CONFLICT", "Product with the same code already exists");
      }
      
      // ✅ التحقق من صحة Category و SubCategory
      await this.validateSubCategory(body.productCategory, body.productSubCategory);

      const newProduct = pick(body, this.keys);
      const product = await super.addDocument(ProductModel, newProduct);
      
      // ✅ Populate category مع SubCategories قبل الإرجاع
      await product.populate({
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus subCategories'
      });
      
      return product;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit product
  public async EditOneProduct(id: string, body: any) {
    try {
      // ✅ التحقق من Category و SubCategory إذا تم تقديمهما
      if (body.productCategory && body.productSubCategory) {
        await this.validateSubCategory(body.productCategory, body.productSubCategory);
      } else if (body.productCategory || body.productSubCategory) {
        // إذا تم تحديث أحدهما فقط، نحتاج للتحقق من المنتج الحالي
        const currentProduct = await ProductModel.findById(id);
        if (!currentProduct) {
          throw new ApiError("NOT_FOUND", `Product with id ${id} not found`);
        }

        const categoryId = body.productCategory || currentProduct.productCategory;
        const subCategoryId = body.productSubCategory || currentProduct.productSubCategory;
        
        await this.validateSubCategory(categoryId, subCategoryId);
      }

      const updateData = pick(body, this.keys);
      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate({
        path: 'productCategory',
        select: 'categoryNameAr categoryNameEn categoryStatus subCategories'
      });

      if (!updatedProduct) {
        throw new ApiError("NOT_FOUND", `Product with id ${id} not found`);
      }

      return updatedProduct;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Product with id ${id} not found`);
    }
  }

  // 🟢 Delete product
  public async DeleteOneProduct(id: string) {
    try {
      const result = await super.deleteDocument(ProductModel, id);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Product with id ${id} not found`);
    }
  }

  // ✅ Get SubCategories by Category ID
  public async GetSubCategoriesByCategory(categoryId: string) {
    try {
      const category = await CategoryModel.findById(categoryId);
      if (!category) {
        throw new ApiError("NOT_FOUND", "Category not found");
      }
      console.log(category.subCategories);
      
      return category.subCategories || [];
    } catch (error) {
      throw error;
    }
  }

  // ✅ Export Products - محدث لدعم SubCategory
  public async ExportProducts(query?: any) {
    try {
      console.log('Export query received:', query);
      
      const keys = this.keys.sort();
      const {
        perPage = 999999,
        page = 1,
        sorts = [],
        queries = [],
      } = pick(query, ["perPage", "page", "sorts", "queries"]);

      console.log('Export filters:', { sorts, queries });

      const result = await super.PaginateHandler(
        ProductModel,
        Number(perPage),
        Number(page),
        sorts,
        queries
      );

      console.log(`Found ${result.data.length} products for export out of ${result.count} total`);

      // ✅ Populate category مع SubCategories
      if (result.data && result.data.length > 0) {
        await ProductModel.populate(result.data, { 
          path: 'productCategory',
          select: 'categoryNameAr categoryNameEn categoryStatus subCategories'
        });
      }

      // ✅ تحويل البيانات لصيغة الإكسبورت مع SubCategory
      const exportData = result.data.map((product: any) => {
        let categoryNameEn = '';
        let categoryNameAr = '';
        let categoryId = '';
        let categoryStatus = false;
        let subCategoryNameEn = '';
        let subCategoryNameAr = '';
        let subCategoryId = '';
        
        if (product.productCategory && typeof product.productCategory === 'object') {
          categoryNameEn = product.productCategory.categoryNameEn || '';
          categoryNameAr = product.productCategory.categoryNameAr || '';
          categoryId = product.productCategory._id || '';
          categoryStatus = product.productCategory.categoryStatus || false;
          
          // ✅ العثور على معلومات SubCategory
          if (product.productSubCategory && product.productCategory.subCategories) {
            const subCategory = product.productCategory.subCategories.find((sub: any) => 
              sub._id.toString() === product.productSubCategory.toString()
            );
            
            if (subCategory) {
              subCategoryNameEn = subCategory.subCategoryNameEn || '';
              subCategoryNameAr = subCategory.subCategoryNameAr || '';
              subCategoryId = subCategory._id || '';
            }
          }
        }

        // تحويل discount tiers لـ string format
        let discountTiersText = '';
        if (product.discountTiers && product.discountTiers.length > 0) {
          discountTiersText = product.discountTiers.map((tier: any) => 
            `${tier.quantity}: ${tier.discount}%`
          ).join('; ');
        }

        return {
          productCode: product.productCode || "",
          productNameAr: product.productNameAr || "",
          productNameEn: product.productNameEn || "",
          productDescriptionAr: product.productDescriptionAr || "",
          productDescriptionEn: product.productDescriptionEn || "",
          productPrice: product.productPrice || 0,
          categoryId: categoryId,
          categoryNameEn: categoryNameEn,
          categoryNameAr: categoryNameAr,
          categoryStatus: categoryStatus,
          subCategoryId: subCategoryId, // ✅ إضافة SubCategory
          subCategoryNameEn: subCategoryNameEn, // ✅ إضافة SubCategory
          subCategoryNameAr: subCategoryNameAr, // ✅ إضافة SubCategory
          productForm: product.productForm || 'Solid',
          productStatus: product.productStatus || false,
          productDiscount: product.productDiscount || 0,
          discountTiers: discountTiersText,
          discountTiersRaw: product.discountTiers || [],
          createdAt: product.createdAt || null,
          updatedAt: product.updatedAt || null
        }; 
      });

      return exportData;
    } catch (error) {
      console.error('Export products error:', error);
      throw error;
    }
  }

  // ✅ Export discount tiers - محدث لدعم SubCategory
  public async ExportDiscountTiers(query?: any) {
    try {
      console.log('Export discount tiers query received:', query);
      
      const keys = this.keys.sort();
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

      // ✅ Populate category مع SubCategories
      if (result.data && result.data.length > 0) {
        await ProductModel.populate(result.data, { 
          path: 'productCategory',
          select: 'categoryNameAr categoryNameEn subCategories'
        });
      }

      const discountTiersData: any[] = [];
      
      result.data.forEach((product: any) => {
        if (product.discountTiers && product.discountTiers.length > 0) {
          // ✅ الحصول على معلومات SubCategory
          let subCategoryNameEn = '';
          let subCategoryNameAr = '';
          
          if (product.productSubCategory && product.productCategory?.subCategories) {
            const subCategory = product.productCategory.subCategories.find((sub: any) => 
              sub._id.toString() === product.productSubCategory.toString()
            );
            
            if (subCategory) {
              subCategoryNameEn = subCategory.subCategoryNameEn || '';
              subCategoryNameAr = subCategory.subCategoryNameAr || '';
            }
          }

          product.discountTiers.forEach((tier: any) => {
            discountTiersData.push({
              productCode: product.productCode || "",
              productNameAr: product.productNameAr || "",
              productNameEn: product.productNameEn || "",
              categoryNameEn: product.productCategory?.categoryNameEn || "",
              categoryNameAr: product.productCategory?.categoryNameAr || "",
              subCategoryNameEn: subCategoryNameEn, // ✅ إضافة SubCategory
              subCategoryNameAr: subCategoryNameAr, // ✅ إضافة SubCategory
              quantity: tier.quantity || 0,
              discount: tier.discount || 0,
              tierCode: tier.code || product.productCode || ""
            });
          });
        }
      });

      console.log(`Found ${discountTiersData.length} discount tiers for export`);
      return discountTiersData;
    } catch (error) {
      console.error('Export discount tiers error:', error);
      throw error;
    }
  }

  // ✅ Export Categories - مع SubCategories
  public async ExportCategories(queryParams?: any) {
    try {
      console.log('Export categories query received:', queryParams);

      const categories = await Category.aggregate([
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
            _id: 1,
            categoryNameAr: 1,
            categoryNameEn: 1,
            categoryDescriptionAr: 1,
            categoryDescriptionEn: 1,
            categoryStatus: 1,
            subCategories: 1,
            productsCount: 1,
            subCategoriesCount: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        { $sort: { categoryNameEn: 1 } }
      ]);

      console.log(`Found ${categories.length} categories for export`);
      return categories;
    } catch (error) {
      console.error("Error exporting categories:", error);
      throw new Error("Failed to export categories");
    }
  }

  // ✅ Import products - محدث لدعم SubCategory
  public async ImportProducts(productsData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[]
      };

      for (const productData of productsData) {
        try {
          // Check if product exists
          const existingProduct = await ProductModel.findOne({ 
            productCode: productData.productCode 
          });

          // ✅ Get category and subcategory
          let categoryId = null;
          let subCategoryId = null;
          
          if (productData.categoryNameEn || productData.categoryNameAr) {
            let category = null;
            
            // Search by English name first
            if (productData.categoryNameEn) {
              category = await CategoryModel.findOne({ 
                categoryNameEn: productData.categoryNameEn 
              });
            }
            
            // If not found by English, try Arabic
            if (!category && productData.categoryNameAr) {
              category = await CategoryModel.findOne({ 
                categoryNameAr: productData.categoryNameAr 
              });
            }

            if (category) {
              categoryId = category._id;
              
              // ✅ البحث عن SubCategory
              if (productData.subCategoryNameEn || productData.subCategoryNameAr) {
                const subCategory = category.subCategories?.find((sub: any) => 
                  sub.subCategoryNameEn === productData.subCategoryNameEn ||
                  sub.subCategoryNameAr === productData.subCategoryNameAr
                );
                
                if (subCategory) {
                  subCategoryId = subCategory._id;
                } else {
                  const subCategoryName = productData.subCategoryNameEn || productData.subCategoryNameAr;
                  results.failed.push({
                    productCode: productData.productCode,
                    error: `SubCategory '${subCategoryName}' not found in category '${category.categoryNameEn}'`
                  });
                  continue;
                }
              } else {
                // إذا لم يتم تحديد subcategory ولكن مطلوب
                results.failed.push({
                  productCode: productData.productCode,
                  error: "SubCategory is required"
                });
                continue;
              }
            } else {
              const categoryName = productData.categoryNameEn || productData.categoryNameAr;
              results.failed.push({
                productCode: productData.productCode,
                error: `Category '${categoryName}' not found`
              });
              continue;
            }
          } else {
            results.failed.push({
              productCode: productData.productCode,
              error: "Category is required"
            });
            continue;
          }

          // ✅ Prepare product data
          const productToSave = {
            ...productData,
            productCategory: categoryId,
            productSubCategory: subCategoryId, // ✅ إضافة SubCategory
            productStatus: productData.productStatus === 'Active',
            discountTiers: productData.discountTiers || []
          };

          // Remove category and subcategory name fields
          delete productToSave.categoryNameEn;
          delete productToSave.categoryNameAr;
          delete productToSave.subCategoryNameEn;
          delete productToSave.subCategoryNameAr;

          if (existingProduct) {
            // Update existing product
            await ProductModel.findByIdAndUpdate(
              existingProduct._id,
              productToSave,
              { new: true }
            );
            results.updated.push(productData.productCode);
          } else {
            // Create new product
            await ProductModel.create(productToSave);
            results.success.push(productData.productCode);
          }
        } catch (error: any) {
          results.failed.push({
            productCode: productData.productCode,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Bulk update discount tiers
  public async BulkUpdateDiscountTiers(discountData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[]
      };

      for (const item of discountData) {
        try {
          const { productCode, discountTiers } = item;
          
          // Validate and format discount tiers
          const formattedTiers = discountTiers.map((tier: any) => ({
            quantity: Number(tier.quantity),
            discount: Number(tier.discount),
            code: productCode
          }));

          await ProductModel.findOneAndUpdate(
            { productCode },
            { 
              $set: { 
                discountTiers: formattedTiers 
              } 
            },
            { new: true }
          );

          results.success.push(productCode);
        } catch (error: any) {
          results.failed.push({
            productCode: item.productCode,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }
}