// ProductService.js
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import ProductModel from "../../../models/productSchema";
import CategoryModel from "../../../models/categorySchema";
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
      "productImage",
      "productStatus",
      "productPurity",
      "productGrade",
      "productForm",
      "productDiscount",
      "productCode",
      "discountTiers"
    ];
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

    // Then populate the category field for each product
    if (result.data && result.data.length > 0) {
      await ProductModel.populate(result.data, { path: 'productCategory' });
    }

    return { result, keys };
  }

  // 🟢 Get one product by ID
  public async GetOneProduct(id: string) {
    try {
      const product = await ProductModel.findById(id).populate('productCategory');
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
          !body.productPurity || !body.productGrade || !body.productForm || !body.productCode) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'productNameAr', 'productNameEn', 'productDescriptionAr', 'productDescriptionEn', 'productCode', 'productPrice', 'productCategory', 'productPurity', 'productGrade', 'productForm' are required"
        );
      }
      
      // Check if productCode exists
      const existingProduct = await ProductModel.findOne({ productCode: body.productCode });
      if (existingProduct) {
        throw new ApiError("CONFLICT", "Product with the same code already exists");
      }
      
      // Validate category exists
      const categoryExists = await CategoryModel.findById(body.productCategory);
      if (!categoryExists) {
        throw new ApiError("BAD_REQUEST", "Invalid category ID");
      }

      const newProduct = pick(body, this.keys);
      const product = await super.addDocument(ProductModel, newProduct);
      
      // Populate category before returning
      await product.populate('productCategory');
      return product;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit product
  public async EditOneProduct(id: string, body: any) {
    try {
      // Validate category if provided
      if (body.productCategory) {
        const categoryExists = await CategoryModel.findById(body.productCategory);
        if (!categoryExists) {
          throw new ApiError("BAD_REQUEST", "Invalid category ID");
        }
      }

      const updateData = pick(body, this.keys);
      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('productCategory');

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

  // 🟢 Export products to Excel format - UPDATED FOR NEW CATEGORY STRUCTURE
// 🟢 Export products to Excel format - مع استخدام الفلاتر المطبقة
// في ProductService.js
// 🟢 Export products to Excel format - مع استخدام الفلاتر المطبقة
// في ProductService.js
// 🟢 Export products with exact same filtering as GetProducts
// في ProductService.js - تحديث للدالة الأصلية
// ProductService.js - تحديث ExportProducts
public async ExportProducts(query?: any) {
  try {
    console.log('Export query received:', query);
    
    // استخدام نفس منطق GetProducts بالضبط
    const keys = this.keys.sort();
    const {
      perPage = 999999, // رقم كبير عشان نجيب كل البيانات
      page = 1,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    console.log('Export filters:', { sorts, queries });

    // استخدام PaginateHandler زي GetProducts بالضبط
    const result = await super.PaginateHandler(
      ProductModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    console.log(`Found ${result.data.length} products for export out of ${result.count} total`);

    // تحويل البيانات لصيغة الإكسبورت
    const exportData = result.data.map((product: any) => {
      let categoryNameEn = '';
      let categoryNameAr = '';
      
      if (product.productCategory && typeof product.productCategory === 'object') {
        categoryNameEn = product.productCategory.categoryNameEn || '';
        categoryNameAr = product.productCategory.categoryNameAr || '';
      }

      // تحويل discount tiers لـ string format للعرض في الـ main sheet
      let discountTiersText = '';
      if (product.discountTiers && product.discountTiers.length > 0) {
        discountTiersText = product.discountTiers.map((tier: any) => 
          `${tier.quantity}: ${tier.discount}%`
        ).join('; ');
      }

      return {
        productCode: product.productCode,
        productNameAr: product?.productNameAr,
        productNameEn: product?.productNameEn,
        productDescriptionAr: product?.productDescriptionAr,
        productDescriptionEn: product?.productDescriptionEn,
        productPrice: product?.productPrice,
        categoryNameEn: categoryNameEn,
        categoryNameAr: categoryNameAr,
        productPurity: product?.productPurity,
        productGrade: product?.productGrade,
        productForm: product?.productForm,
        productStatus: product?.productStatus ? 'Active' : 'Inactive',
        productDiscount: product?.productDiscount || 0,
        discountTiers: discountTiersText, // النسخة النصية
        discountTiersRaw: product?.discountTiers || [] // النسخة الخام للـ separate sheet
      }; 
    });

    return exportData;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

// 🟢 Export discount tiers separately - جديد
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

    // استخدام نفس الفلتر
    const result = await super.PaginateHandler(
      ProductModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    // تحويل البيانات لصيغة discount tiers
    const discountTiersData: any[] = [];
    
    result.data.forEach((product: any) => {
      if (product.discountTiers && product.discountTiers.length > 0) {
        product.discountTiers.forEach((tier: any) => {
          discountTiersData.push({
            productCode: product.productCode,
            productNameAr: product.productNameAr,
            productNameEn: product.productNameEn,
            quantity: tier.quantity,
            discount: tier.discount,
            tierCode: tier.code || product.productCode
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

  // 🟢 Import products from Excel - UPDATED FOR NEW CATEGORY STRUCTURE
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

          // Get category by name - UPDATED to handle new structure
          let categoryId = null;
          
          // Try to find category by English name first, then Arabic name
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
            
            // Fallback: search by old categoryName field if still exists
            if (!category && productData.categoryName) {
              category = await CategoryModel.findOne({
                $or: [
                  { categoryNameEn: productData.categoryName },
                  { categoryNameAr: productData.categoryName }
                ]
              });
            }

            if (category) {
              categoryId = category._id;
            } else {
              const categoryName = productData.categoryNameEn || productData.categoryNameAr || productData.categoryName;
              results.failed.push({
                productCode: productData.productCode,
                error: `Category '${categoryName}' not found`
              });
              continue;
            }
          }

          // Prepare product data
          const productToSave = {
            ...productData,
            productCategory: categoryId,
            productStatus: productData.productStatus === 'Active',
            discountTiers: productData.discountTiers || []
          };

          // Remove category name fields as they're not in product schema
          delete productToSave.categoryNameEn;
          delete productToSave.categoryNameAr;
          delete productToSave.categoryName; // Remove old field too

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