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
      "productName",
      "productDescription",
      "productPrice",
      "productCategory", // This should be ObjectId, not categoryName
      "productImage",
      "productStatus",
      "productPurity",
      "productGrade",
      "productForm",
      "productDiscount",
      "productCode", // أضف productCode هنا
      "discountTiers" // أضف discountTiers
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
      if (!body.productName || !body.productPrice || !body.productCategory || !body.productPurity || !body.productGrade || !body.productForm || !body.productCode) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'productName', 'productCode', 'productPrice', 'productCategory', 'productPurity', 'productGrade', 'productForm' are required"
        );
      }
       //nproductCode is exists
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

  // 🟢 Export products to Excel format
  public async ExportProducts(filters?: any) {
    try {
      const query = filters?.queries || [];
      const products = await ProductModel.find(
        query.length > 0 ? { $and: query } : {}
      ).populate('productCategory');

      const exportData = products.map((product: any) => {
        // Use type assertion for populated document
        const categoryName = product.productCategory && typeof product.productCategory === 'object' 
          ? product.productCategory.categoryName 
          : '';

        return {
          productCode: product.productCode,
          productName: product.productName,
          productDescription: product.productDescription,
          productPrice: product.productPrice,
          categoryName: categoryName,
          productPurity: product.productPurity,
          productGrade: product.productGrade,
          productForm: product.productForm,
          productStatus: product.productStatus ? 'Active' : 'Inactive',
          productDiscount: product.productDiscount || 0,
          discountTiers: product.discountTiers || []
        };
      });

      return exportData;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Import products from Excel
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

          // Get category by name
          let categoryId = null;
          if (productData.categoryName) {
            const category = await CategoryModel.findOne({ 
              categoryName: productData.categoryName 
            });
            if (category) {
              categoryId = category._id;
            } else {
              results.failed.push({
                productCode: productData.productCode,
                error: `Category '${productData.categoryName}' not found`
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

          // Remove categoryName as it's not in schema
          delete productToSave.categoryName;

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