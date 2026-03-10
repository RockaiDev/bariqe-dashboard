import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import Category from "../models/categorySchema";
import Product from "../models/productSchema";

// Load environment variables
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

/* ================================
   Seed Data — Home Cleaning Categories
   ================================ */
const categoriesData = [
    {
        categoryNameAr: "منظفات الأرضيات",
        categoryNameEn: "Floor Cleaners",
        categoryDescriptionAr: "جميع أنواع منظفات الأرضيات للمنازل والمكاتب",
        categoryDescriptionEn: "All types of floor cleaning products for homes and offices",
        categoryStatus: true,
        subCategories: [
            {
                subCategoryNameAr: "منظف بلاط",
                subCategoryNameEn: "Tile Cleaner",
                subCategoryDescriptionAr: "منظفات مخصصة للبلاط",
                subCategoryDescriptionEn: "Specialized tile cleaning products",
                subCategoryStatus: true,
            },
            {
                subCategoryNameAr: "منظف رخام",
                subCategoryNameEn: "Marble Cleaner",
                subCategoryDescriptionAr: "منظفات مخصصة للرخام",
                subCategoryDescriptionEn: "Specialized marble cleaning products",
                subCategoryStatus: true,
            },
        ],
    },
    {
        categoryNameAr: "منظفات المطبخ",
        categoryNameEn: "Kitchen Cleaners",
        categoryDescriptionAr: "منظفات متخصصة للمطبخ وأدوات الطهي",
        categoryDescriptionEn: "Specialized cleaning products for kitchens and cookware",
        categoryStatus: true,
        subCategories: [
            {
                subCategoryNameAr: "مزيل دهون",
                subCategoryNameEn: "Degreaser",
                subCategoryDescriptionAr: "مزيلات الدهون والشحوم",
                subCategoryDescriptionEn: "Grease and oil removers",
                subCategoryStatus: true,
            },
            {
                subCategoryNameAr: "منظف أفران",
                subCategoryNameEn: "Oven Cleaner",
                subCategoryDescriptionAr: "منظفات مخصصة للأفران والشوايات",
                subCategoryDescriptionEn: "Specialized oven and grill cleaners",
                subCategoryStatus: true,
            },
        ],
    },
    {
        categoryNameAr: "منظفات الحمامات",
        categoryNameEn: "Bathroom Cleaners",
        categoryDescriptionAr: "منظفات ومعطرات الحمامات",
        categoryDescriptionEn: "Bathroom cleaning and freshening products",
        categoryStatus: true,
        subCategories: [
            {
                subCategoryNameAr: "مزيل ترسبات",
                subCategoryNameEn: "Limescale Remover",
                subCategoryDescriptionAr: "مزيلات ترسبات الكلس والجير",
                subCategoryDescriptionEn: "Limescale and calcium deposit removers",
                subCategoryStatus: true,
            },
        ],
    },
];

/* ================================
   Seed Data — Home Cleaning Products
   (categoryIndex maps to categoriesData above)
   ================================ */
const productsData = [
    // ── Floor Cleaners (index 0) ──
    {
        categoryIndex: 0,
        productNameAr: "منظف أرضيات متعدد الأسطح",
        productNameEn: "Multi-Surface Floor Cleaner",
        productDescriptionAr: "منظف أرضيات فعال لجميع أنواع الأسطح، يزيل الأوساخ والبقع بسهولة",
        productDescriptionEn: "Effective floor cleaner for all surface types, easily removes dirt and stains",
        productOldPrice: 25,
        productDiscount: "10",
        amount: 150,
        moreSale: false,
        productMoreSale: true,
    },
    {
        categoryIndex: 0,
        productNameAr: "محلول ممسحة بخار",
        productNameEn: "Steam Mop Solution",
        productDescriptionAr: "محلول تنظيف مخصص للممسحة البخارية، يترك رائحة منعشة",
        productDescriptionEn: "Cleaning solution designed for steam mops, leaves a fresh scent",
        productOldPrice: 40,
        productDiscount: "15",
        amount: 80,
        moreSale: false,
        productMoreSale: false,
    },
    {
        categoryIndex: 0,
        productNameAr: "منظف بلاط قوي المفعول",
        productNameEn: "Heavy-Duty Tile Cleaner",
        productDescriptionAr: "منظف بلاط قوي يزيل البقع الصعبة والأوساخ المتراكمة",
        productDescriptionEn: "Powerful tile cleaner that removes tough stains and built-up grime",
        productOldPrice: 35,
        productDiscount: "5",
        amount: 120,
        moreSale: true,
        productMoreSale: true,
    },

    // ── Kitchen Cleaners (index 1) ──
    {
        categoryIndex: 1,
        productNameAr: "بخاخ مزيل دهون المطبخ",
        productNameEn: "Kitchen Degreaser Spray",
        productDescriptionAr: "بخاخ قوي لإزالة الدهون والشحوم من أسطح المطبخ",
        productDescriptionEn: "Powerful spray for removing grease and oil from kitchen surfaces",
        productOldPrice: 20,
        productDiscount: "10",
        amount: 200,
        moreSale: false,
        productMoreSale: true,
    },
    {
        categoryIndex: 1,
        productNameAr: "منظف الأفران والشوايات",
        productNameEn: "Oven & Grill Cleaner",
        productDescriptionAr: "منظف متخصص للأفران والشوايات، يزيل الدهون المحترقة",
        productDescriptionEn: "Specialized oven and grill cleaner, removes burnt-on grease",
        productOldPrice: 30,
        productDiscount: "20",
        amount: 60,
        moreSale: false,
        productMoreSale: false,
    },
    {
        categoryIndex: 1,
        productNameAr: "منظف أسطح ستانلس ستيل",
        productNameEn: "Stainless Steel Cleaner",
        productDescriptionAr: "منظف وملمع للأسطح الستانلس ستيل، يمنع بصمات الأصابع",
        productDescriptionEn: "Cleaner and polish for stainless steel surfaces, prevents fingerprints",
        productOldPrice: 22,
        productDiscount: "5",
        amount: 100,
        moreSale: false,
        productMoreSale: true,
    },

    // ── Bathroom Cleaners (index 2) ──
    {
        categoryIndex: 2,
        productNameAr: "منظف حمامات مضاد للبكتيريا",
        productNameEn: "Anti-Bacterial Bathroom Cleaner",
        productDescriptionAr: "منظف حمامات يقضي على 99.9% من البكتيريا والجراثيم",
        productDescriptionEn: "Bathroom cleaner that kills 99.9% of bacteria and germs",
        productOldPrice: 18,
        productDiscount: "10",
        amount: 180,
        moreSale: true,
        productMoreSale: true,
    },
    {
        categoryIndex: 2,
        productNameAr: "جل مزيل ترسبات الكلس",
        productNameEn: "Limescale Remover Gel",
        productDescriptionAr: "جل فعال لإزالة ترسبات الكلس والجير من الحنفيات والمرايا",
        productDescriptionEn: "Effective gel for removing limescale deposits from taps and mirrors",
        productOldPrice: 28,
        productDiscount: "15",
        amount: 90,
        moreSale: false,
        productMoreSale: false,
    },
    {
        categoryIndex: 2,
        productNameAr: "بخاخ معطر حمامات",
        productNameEn: "Bathroom Freshener Spray",
        productDescriptionAr: "معطر حمامات برائحة اللافندر المنعشة، يدوم طويلاً",
        productDescriptionEn: "Lavender-scented bathroom freshener spray, long-lasting fragrance",
        productOldPrice: 15,
        productDiscount: "5",
        amount: 250,
        moreSale: false,
        productMoreSale: true,
    },
];

/* ================================
         Seeder Script
   ================================ */
async function seed() {
    try {
        // ── Parse flags ──
        const args = process.argv.slice(2);
        const shouldClear = args.includes("--clear");

        // ── Connect to MongoDB ──
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined!");
        }

        console.log("🔌 Connecting to MongoDB...");
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            w: "majority" as const,
        };
        await mongoose.connect(process.env.MONGO_URI, options);
        console.log("✅ Connected to MongoDB\n");

        // ── Clear existing data if --clear flag is passed ──
        if (shouldClear) {
            console.log("🗑️  --clear flag detected. Removing existing data...");
            await Category.deleteMany({});
            await Product.deleteMany({});
            console.log("✅ Existing categories and products deleted\n");
        }

        // ── Check if data already exists ──
        const existingCategories = await Category.countDocuments();
        const existingProducts = await Product.countDocuments();

        if (existingCategories > 0 || existingProducts > 0) {
            console.log(
                `⚠️  Database already contains ${existingCategories} categories and ${existingProducts} products.`
            );
            console.log('   Run with --clear flag to reset: npm run seed -- --clear\n');
            await mongoose.connection.close();
            process.exit(0);
        }

        // ── 1. Seed Categories ──
        console.log("📂 Seeding categories...");
        const createdCategories = await Category.insertMany(categoriesData);
        console.log(`   ✅ ${createdCategories.length} categories created:`);
        createdCategories.forEach((cat) => {
            console.log(`      • ${cat.categoryNameEn} (${cat.categoryNameAr}) — ID: ${cat._id}`);
        });
        console.log();

        // ── 2. Seed Products ──
        console.log("📦 Seeding products...");
        const productDocs = productsData.map((p) => {
            const { categoryIndex, ...productFields } = p;
            return {
                ...productFields,
                productCategory: createdCategories[categoryIndex]._id,
            };
        });

        const createdProducts = await Product.insertMany(productDocs);
        console.log(`   ✅ ${createdProducts.length} products created:`);
        createdProducts.forEach((prod) => {
            console.log(`      • ${prod.productNameEn} (${prod.productNameAr}) — ${prod.productOldPrice} SAR`);
        });
        console.log();

        // ── Summary ──
        console.log("=".repeat(50));
        console.log("🎉 Seeding complete!");
        console.log(`   📂 Categories: ${createdCategories.length}`);
        console.log(`   📦 Products:   ${createdProducts.length}`);
        console.log("=".repeat(50));

        // ── Close connection ──
        await mongoose.connection.close();
        console.log("\n✅ Database connection closed");
        process.exit(0);
    } catch (error: any) {
        console.error("\n❌ Seeding error:", error.message);
        if (error.code === 11000) {
            console.error("   Duplicate key error — some data may already exist.");
            console.error('   Try running with --clear flag: npm run seed -- --clear');
        }
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run
seed();
