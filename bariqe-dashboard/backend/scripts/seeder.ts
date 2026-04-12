import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { genSaltSync, hashSync } from "bcryptjs";

// Models
import Category from "../models/categorySchema";
import Product from "../models/productSchema";
import Admin from "../models/adminSchema";
import BusinessInfo from "../models/businessInfoSchema";
import Customer from "../models/customerSchema";
import Order from "../models/orderSchema";
import Event from "../models/eventSchema";
import Contact from "../models/contactSchema";
import ConsultationRequest from "../models/consultationRequestsSchema";
import MaterialRequest from "../models/materialRequestsSchema";

// Load environment variables
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

/* ================================
   1. Helper Functions
   ================================ */
const generateHash = (password: string): string => {
    const salt = genSaltSync(10);
    return hashSync(password, salt);
};

/* ================================
   2. Seed Data
   ================================ */

// ── Admin ──
const adminData = {
    firstName: "System Admin",
    email: "admin@bariqe.co",
    password: generateHash("Admin@2025"),
    role: "admin",
};

// ── Business Info ──
const businessInfoData = {
    title_ar: "بريق المتخصصة",
    title_en: "Bariqe Specialized",
    description_ar: "حلول تنظيف وتعقيم متطورة بخبرة عالمية.",
    description_en: "Advanced cleaning and sterilization solutions with global expertise.",
    logo: "https://res.cloudinary.com/db152mwtg/image/upload/v1740000000/logo.png",
    email: "info@bariqe.co",
    phone: "+966 500 000 000",
    whatsapp: "+966 500 000 000",
    address_ar: "الرياض، المملكة العربية السعودية",
    address_en: "Riyadh, Saudi Arabia",
    facebook: "https://facebook.com/bariqe",
    about: {
        hero_image: "https://res.cloudinary.com/db152mwtg/image/upload/v1740000000/about-hero.jpg",
        main_title_ar: "من نحن",
        main_title_en: "About Us",
        main_description_ar: "نحن شركة رائدة في مجال حلول التنظيف المتخصصة.",
        main_description_en: "We are a leading provider of specialized cleaning solutions.",
        sections: [
            {
                hero_image: "https://res.cloudinary.com/db152mwtg/image/upload/v1740000000/vision.jpg",
                title_ar: "رؤيتنا",
                title_en: "Our Vision",
                description_ar: "أن نكون الخيار الأول في جودة الحلول الكيميائية.",
                description_en: "To be the first choice in chemical solution quality.",
                display_order: 1,
            }
        ]
    },
    is_active: true,
};

// ── Categories & Subcategories ──
const categoriesData = [
    {
        categoryNameAr: "حلول تعقيم المستشفيات",
        categoryNameEn: "Hospital Sterilization",
        categoryDescriptionAr: "منظفات مخصصة للمنشآت الصحية والطبية",
        categoryDescriptionEn: "Sterilization solutions for health care and medical facilities",
        subCategories: [
            { subCategoryNameAr: "تعقيم الأدوات", subCategoryNameEn: "Tool Sterilization" },
            { subCategoryNameAr: "تنظيف الأرضيات الطبية", subCategoryNameEn: "Medical Floor Cleaning" }
        ],
    },
    {
        categoryNameAr: "قطاع الأغذية والمشروبات",
        categoryNameEn: "Food & Beverage Sector",
        categoryDescriptionAr: "أعلى معايير السلامة والنظافة للصناعات الغذائية",
        categoryDescriptionEn: "Highest standards of safety and hygiene for food industries",
        subCategories: [
            { subCategoryNameAr: "غسيل خطوط الإنتاج", subCategoryNameEn: "Line Cleaning" },
            { subCategoryNameAr: "منظفات المخابز", subCategoryNameEn: "Bakery Cleaners" }
        ],
    },
    {
        categoryNameAr: "العناية بالمنسوجات والمغاسل",
        categoryNameEn: "Laundry & Textile Care",
        categoryDescriptionAr: "منظفات ومعطرات للمغاسل المركزية",
        categoryDescriptionEn: "Detergents and fresheners for central laundries",
        subCategories: [
            { subCategoryNameAr: "سائل الغسيل", subCategoryNameEn: "Liquid Detergent" },
            { subCategoryNameAr: "منعم الأقمشة", subCategoryNameEn: "Fabric Softener" }
        ],
    }
];

// ── Products ──
const productsData = [
    {
        categoryIndex: 0,
        productNameAr: "بريق-سيف معقم أسطح طوارئ",
        productNameEn: "Bariqe-Safe ER Surface Sanitizer",
        productDescriptionAr: "معقم طبي فعال يقضي على 99.9% من الفيروسات في 30 ثانية.",
        productDescriptionEn: "Medical-grade sanitizer kills 99.9% of viruses in 30 seconds.",
        productOldPrice: 85,
        productDiscount: "15% OFF",
        amount: 500,
        productMoreSale: true,
        productOptions: [
            { name: "5 Liters", price: 85, quantity: 1, description: "Bulk Container" },
            { name: "1 Liter Spray", price: 25, quantity: 1, description: "Ready to use" }
        ]
    },
    {
        categoryIndex: 1,
        productNameAr: "كلين-برو لمنظفات المخابز",
        productNameEn: "Clean-Pro Bakery Degreaser",
        productDescriptionAr: "مزيل دهون عالي التركيز للأفران والأسطح الغذائية.",
        productDescriptionEn: "High-concentration degreaser for ovens and food surfaces.",
        productOldPrice: 120,
        productDiscount: "Special Offer",
        amount: 200,
        productMoreSale: true,
    },
    {
        categoryIndex: 2,
        productNameAr: "لافندر رويال معطر أقمشة",
        productNameEn: "Lavender Royal Fabric Freshener",
        productDescriptionAr: "معطر مركز يدوم طويلاً للملابس والمفروشات.",
        productDescriptionEn: "Concentrated long-lasting freshener for clothes and linens.",
        productOldPrice: 45,
        productDiscount: "20",
        amount: 1000,
        productMoreSale: false,
    }
];

// ── Customers ──
const customersData = [
    {
        customerName: "Mohamed Ahmed",
        customerEmail: "mohamed@example.com",
        customerPhone: "+966512345678",
        customerAddress: "King Fahd Road, Riyadh",
        customerSource: "order",
        isVerified: true,
    },
    {
        customerName: "Sara Kalid",
        customerEmail: "sara@example.com",
        customerPhone: "+966587654321",
        customerAddress: "Prince Sultan St, Jeddah",
        customerSource: "consultation",
        isGuest: true,
    }
];

// ── Events ──
const eventsData = [
    {
        titleAr: "مؤتمر الرياض للسلامة الكيميائية",
        titleEn: "Riyadh Chemical Safety Conference",
        date: new Date("2025-05-15"),
        tagsAr: ["سلامة", "كورتمر"],
        tagsEn: ["Safety", "Conference"],
        contentAr: "مشاركة بريق في مؤتمر السلامة الكيميائية العالمي.",
        contentEn: "Bariqe participating in the Global Chemical Safety Conference.",
        status: "published",
        author: "Marketing Dept",
    }
];

// ── Contact Inquiries ──
const contactData = [
    {
        contactName: "Faisal Al-Otaibi",
        email: "faisal@company.com",
        phoneNumber: "+966509998887",
        services: ["Technical Training & Consultation"],
        message: "I need a consultation for our new chemical laboratory setup.",
        status: false,
    }
];

/* ================================
   3. Seeder Script
   ================================ */
async function seed() {
    try {
        const args = process.argv.slice(2);
        const shouldClear = args.includes("--clear");

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined!");
        }

        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Bariqe" });
        console.log("✅ Connected to MongoDB\n");

        if (shouldClear) {
            console.log("🗑️  Clearing all existing data...");
            await Promise.all([
                Admin.deleteMany({}),
                BusinessInfo.deleteMany({}),
                Category.deleteMany({}),
                Product.deleteMany({}),
                Customer.deleteMany({}),
                Order.deleteMany({}),
                Event.deleteMany({}),
                Contact.deleteMany({}),
                ConsultationRequest.deleteMany({}),
                MaterialRequest.deleteMany({}),
            ]);
            console.log("✅ Collections cleared\n");
        }

        // ── 1. Admin ──
        console.log("🔑 Seeding Admin...");
        await Admin.create(adminData);
        console.log("   ✅ Admin created: " + adminData.email);

        // ── 2. Business Info ──
        console.log("🏢 Seeding Business Info...");
        await BusinessInfo.create(businessInfoData);
        console.log("   ✅ Business Info created");

        // ── 3. Categories ──
        console.log("📂 Seeding Categories...");
        const createdCategories = await Category.insertMany(categoriesData);
        console.log(`   ✅ ${createdCategories.length} categories created`);

        // ── 4. Products ──
        console.log("📦 Seeding Products...");
        const productDocs = productsData.map(p => {
            const { categoryIndex, ...rest } = p;
            return {
                ...rest,
                productCategory: createdCategories[categoryIndex]._id
            };
        });
        const createdProducts = await Product.insertMany(productDocs);
        console.log(`   ✅ ${createdProducts.length} products created`);

        // ── 5. Customers ──
        console.log("👥 Seeding Customers...");
        const createdCustomers = await Customer.insertMany(customersData);
        console.log(`   ✅ ${createdCustomers.length} customers created`);

        // ── 6. Orders (Simulated) ──
        console.log("🛒 Seeding Orders...");
        const ordersData = [
            {
                customer: createdCustomers[0]._id,
                products: [
                    { product: createdProducts[0]._id, quantity: 2, itemDiscount: 0 },
                    { product: createdProducts[1]._id, quantity: 1, itemDiscount: 10 }
                ],
                shippingAddress: {
                    fullName: "Mohamed Ahmed",
                    phone: "+966512345678",
                    street: "King Fahd Road",
                    city: "Riyadh",
                    region: "Central",
                    country: "Saudi Arabia"
                },
                payment: { method: "card", status: "paid", paidAt: new Date() },
                orderQuantity: "3",
                subtotal: 290,
                shippingCost: 25,
                total: 315,
                orderStatus: "delivered"
            },
            {
                products: [
                    { product: createdProducts[2]._id, quantity: 5, itemDiscount: 5 }
                ],
                shippingAddress: {
                    fullName: "Guest User",
                    phone: "+966500000001",
                    street: "Olaya St",
                    city: "Riyadh",
                    region: "Central",
                    country: "Saudi Arabia"
                },
                payment: { method: "cod", status: "pending" },
                orderQuantity: "5",
                subtotal: 225,
                shippingCost: 25,
                total: 250,
                orderStatus: "pending"
            }
        ];
        await Order.insertMany(ordersData);
        console.log("   ✅ 2 sample orders created");

        // ── 7. Events ──
        console.log("📅 Seeding Events...");
        await Event.insertMany(eventsData);
        console.log("   ✅ Events seeded");

        // ── 8. Contact Inquiries ──
        console.log("✉️  Seeding Contact Inquiries...");
        await Contact.insertMany(contactData);
        console.log("   ✅ Contact inquiries seeded");

        // ── 9. Partners/Consultation Requests ──
        console.log("🤝 Seeding Consultation Requests...");
        await ConsultationRequest.create({
            ParntersRequestsName: "Khalid Salman",
            ParntersRequestsEmail: "khalid@industry.sa",
            ParntersRequestsPhone: "+966501112223",
            ParntersRequestsMessage: "Interest in becoming a distributor."
        });
        console.log("   ✅ Consultation request seeded");

        // ── 10. Material Requests ──
        console.log("🧪 Seeding Material Requests...");
        await MaterialRequest.create({
            materialName: "Concentrated Hypochlorite",
            materialPhone: "+966522233344",
            materialQuantity: 10,
            materialIntendedUse: "Water Treatment Plants",
            materialActions: "pending"
        });
        console.log("   ✅ Material request seeded");

        console.log("\n" + "=".repeat(50));
        console.log("🎉 Seeding complete with comprehensive data!");
        console.log("=".repeat(50));

        await mongoose.connection.close();
        process.exit(0);
    } catch (error: any) {
        console.error("\n❌ Seeding error:", error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

seed();
