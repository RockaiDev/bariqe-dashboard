import { Router } from "express";
import multer from "multer";

import ProductController from "../../controllers/products";
import OrderController from "../../controllers/orders";
import CustomerController from "../../controllers/customer";
import MaterialRequestController from "../../controllers/materialRequests";
import CategoryController from "../../controllers/category";
import ConsultationRequestsController from "../../controllers/consultationRequests";
import DashboardController from "../../controllers/dashboard/index";
import EventController from "../../controllers/events";
import DatabaseController from "../../controllers/database";
import ContactController from "../../controllers/contact";
import BusinessInfoController from "../../controllers/businessInfo";
// Initialize protected routes
const protectedRouter = Router();

// Controllers
const productController = new ProductController();
const orderController = new OrderController();
const customerController = new CustomerController();
const materialRequestController = new MaterialRequestController();
const categoryController = new CategoryController();
const consultationRequestsController = new ConsultationRequestsController();
const dashboardController = new DashboardController();
const eventController = new EventController();
const databaseController = new DatabaseController();
const contactController = new ContactController();
const businessInfoController = new BusinessInfoController();
// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = "uploads/";
    
    // تحديد المجلد حسب نوع الملف
    if (file.fieldname === "productImage" || 
        file.fieldname === "categoryImage" || 
        file.fieldname === "eventImage" ||
        file.fieldname === "logo" ||
        file.fieldname === "bannerImage" ||
        file.fieldname === "heroImages" ||
        file.fieldname === "image") {
      uploadDir = "uploads/temp/";
    } else if (file.fieldname === "file") {
      uploadDir = "uploads/";
    } else if (file.fieldname === "eventFiles") {
      uploadDir = "uploads/events/";
    }
    
    if (!require("fs").existsSync(uploadDir)) {
      require("fs").mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "file") {
      const ext = require("path").extname(file.originalname).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xls") {
        return cb(new Error("Only Excel files are allowed"));
      }
    }
    
    // ✅ Support all image uploads
    if (
      file.fieldname === "productImage" || 
      file.fieldname === "categoryImage" || 
      file.fieldname === "eventImage" ||
      file.fieldname === "logo" ||
      file.fieldname === "aboutHeroImage" ||    // ✅ NEW
      file.fieldname === "reviewsHeroImage" ||  // ✅ NEW
      file.fieldname === "bannerImage" ||
      file.fieldname === "heroImages" ||
      file.fieldname === "image"
    ) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
      }
    }
    
    if (file.fieldname === "eventFiles") {
      const allowedTypes = [
        "application/pdf",
        "text/plain", 
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("File type not allowed for event files"));
      }
    }
    
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/* ==============================
   PRODUCT ROUTES
================================ */
// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/products/export",
  productController.exportProducts.bind(productController)
);
protectedRouter.get(
  "/products/download-template",
  productController.downloadTemplate.bind(productController)
);
protectedRouter.post(
  "/products/import",
  productController.importProducts.bind(productController)
);

// CRUD routes
// ✅ Add product routes with different upload methods
protectedRouter.post(
  "/products/base64",
  productController.addProductWithBase64.bind(productController)
);

// ✅ Basic CRUD routes
protectedRouter.get(
  "/products",
  productController.getProducts.bind(productController)
);
protectedRouter.get(
  "/products/:id",
  productController.getOneProduct.bind(productController)
);
protectedRouter.post(
  "/products",
  upload.single("productImage"),
  productController.addProduct.bind(productController)
);
protectedRouter.get(
  "/products/subcategories/:categoryId",
  productController.getSubCategoriesByCategory.bind(productController)
);

// ✅ Edit product routes with different upload methods
protectedRouter.put(
  "/products/:id/base64",
  productController.editProductWithBase64.bind(productController)
);
protectedRouter.put(
  "/products/:id",
  upload.single("productImage"),
  productController.editProduct.bind(productController)
);

// ✅ Image-specific routes
protectedRouter.put(
  "/products/:id/image",
  upload.single("productImage"),
  productController.changeProductImage.bind(productController)
);
protectedRouter.delete(
  "/products/:id/image",
  productController.removeProductImage.bind(productController)
);

// ✅ Delete product
protectedRouter.delete(
  "/products/:id",
  productController.deleteProduct.bind(productController)
);

/* ==============================
   ORDER ROUTES
================================ */
// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/orders/export",
  orderController.exportOrders.bind(orderController)
);
protectedRouter.get(
  "/orders/download-template",
  orderController.downloadTemplate.bind(orderController)
);
protectedRouter.post(
  "/orders/import",
  orderController.importOrders.bind(orderController)
);

// Existing CRUD routes
protectedRouter.get("/orders", orderController.getOrders.bind(orderController));
protectedRouter.get(
  "/orders/:id",
  orderController.getOne.bind(orderController)
);
protectedRouter.post("/orders", orderController.addOrder.bind(orderController));
protectedRouter.put(
  "/orders/:id",
  orderController.editOrder.bind(orderController)
);
protectedRouter.delete(
  "/orders/:id",
  orderController.deleteOrder.bind(orderController)
);

/* ==============================
   CUSTOMER ROUTES
================================ */
// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/customers/export/excel",
  customerController.exportCustomers.bind(customerController)
);
protectedRouter.get(
  "/customers/template/download",
  customerController.downloadTemplate.bind(customerController)
);
protectedRouter.get(
  "/customers/template/bulk",
  customerController.exportBulkTemplate.bind(customerController)
);
protectedRouter.post(
  "/customers/import/excel",
  customerController.importCustomers.bind(customerController)
);
protectedRouter.post(
  "/customers/bulk/update",
  customerController.bulkUpdateCustomers.bind(customerController)
);

// Basic CRUD routes
protectedRouter.get(
  "/customers",
  customerController.getCustomers.bind(customerController)
);
protectedRouter.get(
  "/customers/:id",
  customerController.getOne.bind(customerController)
);
protectedRouter.post(
  "/customers",
  customerController.addCustomer.bind(customerController)
);
protectedRouter.put(
  "/customers/:id",
  customerController.editCustomer.bind(customerController)
);
protectedRouter.delete(
  "/customers/:id",
  customerController.deleteCustomer.bind(customerController)
);

/* ==============================
   MATERIAL REQUEST ROUTES (✅ محدث مع Customer support)
================================ */
// ✅ Stats and Analytics routes (MUST come before /:id routes)
protectedRouter.get(
  "/materialRequests/stats",
  materialRequestController.getStats.bind(materialRequestController)
);

// ✅ Customer-specific routes (MUST come before /:id routes)
protectedRouter.get(
  "/materialRequests/customer/:customerId",
  materialRequestController.getByCustomer.bind(materialRequestController)
);

// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/materialRequests/export",
  materialRequestController.exportMaterialRequests.bind(
    materialRequestController
  )
);
protectedRouter.get(
  "/materialRequests/download-template",
  materialRequestController.downloadTemplate.bind(materialRequestController)
);
protectedRouter.post(
  "/materialRequests/import",
  materialRequestController.importMaterialRequests.bind(
    materialRequestController
  )
);

// Basic CRUD routes
protectedRouter.get(
  "/materialRequests",
  materialRequestController.getAll.bind(materialRequestController)
);
protectedRouter.get(
  "/materialRequests/:id",
  materialRequestController.getOne.bind(materialRequestController)
);
protectedRouter.post(
  "/materialRequests",
  materialRequestController.add.bind(materialRequestController)
);
protectedRouter.put(
  "/materialRequests/:id",
  materialRequestController.edit.bind(materialRequestController)
);
protectedRouter.delete(
  "/materialRequests/:id",
  materialRequestController.delete.bind(materialRequestController)
);

/* ==============================
   CATEGORY ROUTES (مُحدث مع الـ SubCategories)
================================ */

// 🟢 Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/categories/export",
  categoryController.exportCategories.bind(categoryController)
);
protectedRouter.get(
  "/categories/download-template",
  categoryController.downloadTemplate.bind(categoryController)
);
protectedRouter.post(
  "/categories/import",
  categoryController.importCategories.bind(categoryController)
);

// 🟢 Special utility routes (MUST come before /:id routes)
protectedRouter.get(
  "/categories/active",
  categoryController.getActiveCategories.bind(categoryController)
);
protectedRouter.get(
  "/categories/stats",
  categoryController.getCategoryStats.bind(categoryController)
);

// 🟢 Bulk operations (MUST come before /:id routes)
protectedRouter.delete(
  "/categories/bulk-delete",
  categoryController.bulkDeleteCategories.bind(categoryController)
);

// ✅ Add category with base64 (يجب أن يأتي قبل /categories)
protectedRouter.post(
  "/categories/base64",
  categoryController.addCategoryWithBase64.bind(categoryController)
);

// 🟢 SubCategory routes (MUST come before general /:id routes)
protectedRouter.get(
  "/categories/:categoryId/subcategories",
  categoryController.getSubCategories.bind(categoryController)
);
protectedRouter.post(
  "/categories/:categoryId/subcategories",
  categoryController.addSubCategory.bind(categoryController)
);
protectedRouter.put(
  "/categories/:categoryId/subcategories/:subCategoryId",
  categoryController.editSubCategory.bind(categoryController)
);
protectedRouter.delete(
  "/categories/:categoryId/subcategories/:subCategoryId",
  categoryController.deleteSubCategory.bind(categoryController)
);

// ✅ Image-specific routes (يجب أن تأتي قبل /:id)
protectedRouter.put(
  "/categories/:id/image",
  upload.single("categoryImage"),
  categoryController.changeCategoryImage.bind(categoryController)
);
protectedRouter.delete(
  "/categories/:id/image",
  categoryController.removeCategoryImage.bind(categoryController)
);

// 🟢 Status toggle route
protectedRouter.patch(
  "/categories/:id/toggle-status",
  categoryController.toggleCategoryStatus.bind(categoryController)
);

// ✅ Edit with base64
protectedRouter.put(
  "/categories/:id/base64",
  categoryController.editCategoryWithBase64.bind(categoryController)
);

// Basic CRUD routes
protectedRouter.get(
  "/categories",
  categoryController.getCategories.bind(categoryController)
);
protectedRouter.get(
  "/categories/:id",
  categoryController.getOne.bind(categoryController)
);

// ✅ Add category with file upload
protectedRouter.post(
  "/categories",
  upload.single("categoryImage"),
  categoryController.addCategory.bind(categoryController)
);

// ✅ Edit category with file upload
protectedRouter.put(
  "/categories/:id",
  upload.single("categoryImage"),
  categoryController.editCategory.bind(categoryController)
);

protectedRouter.delete(
  "/categories/:id",
  categoryController.deleteCategory.bind(categoryController)
);

/* ==============================
   CONSULTATION REQUEST ROUTES
================================ */
// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/consultation-requests/export",
  consultationRequestsController.exportConsultationRequests.bind(
    consultationRequestsController
  )
);
protectedRouter.get(
  "/consultation-requests/download-template",
  consultationRequestsController.downloadTemplate.bind(
    consultationRequestsController
  )
);
protectedRouter.post(
  "/consultation-requests/import",
  consultationRequestsController.importConsultationRequests.bind(
    consultationRequestsController
  )
);

// Basic CRUD routes
protectedRouter.get(
  "/consultation-requests",
  consultationRequestsController.getAll.bind(consultationRequestsController)
);
protectedRouter.get(
  "/consultation-requests/:id",
  consultationRequestsController.getOne.bind(consultationRequestsController)
);
protectedRouter.post(
  "/consultation-requests",
  consultationRequestsController.add.bind(consultationRequestsController)
);
protectedRouter.put(
  "/consultation-requests/:id",
  consultationRequestsController.edit.bind(consultationRequestsController)
);
protectedRouter.delete(
  "/consultation-requests/:id",
  consultationRequestsController.delete.bind(consultationRequestsController)
);

/* ==============================
   DASHBOARD ROUTES
================================ */
protectedRouter.get(
  "/dashboard",
  dashboardController.getDashboardData.bind(dashboardController)
);

// ✅ Individual endpoints
protectedRouter.get(
  "/dashboard/summary",
  dashboardController.getSummary.bind(dashboardController)
);

protectedRouter.get(
  "/dashboard/recent-orders",
  dashboardController.getRecentOrders.bind(dashboardController)
);

protectedRouter.get(
  "/dashboard/recent-consultations",
  dashboardController.getRecentConsultations.bind(dashboardController)
);

protectedRouter.get(
  "/dashboard/order-trends",
  dashboardController.getOrderTrends.bind(dashboardController)
);

protectedRouter.get(
  "/dashboard/popular-categories",
  dashboardController.getPopularCategories.bind(dashboardController)
);

protectedRouter.get(
  "/dashboard/stats",
  dashboardController.getDashboardStats.bind(dashboardController)
);

protectedRouter.get(
  "/dashboard/revenue",
  dashboardController.getMonthlyRevenue.bind(dashboardController)
);

/* ==============================
   EVENT ROUTES (مُحدث لدعم الصور)
================================ */
// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/events/export",
  eventController.exportEvents.bind(eventController)
);
protectedRouter.get(
  "/events/download-template",
  eventController.downloadTemplate.bind(eventController)
);
protectedRouter.post(
  "/events/import",
  eventController.importEvents.bind(eventController)
);

// ✅ Add event with base64 image (يجب أن يأتي قبل /events)
protectedRouter.post(
  "/events/base64",
  eventController.addEventWithBase64.bind(eventController)
);

// ✅ Image-specific routes (يجب أن تأتي قبل /:id)
protectedRouter.put(
  "/events/:id/image",
  upload.single("eventImage"),
  eventController.changeEventImage.bind(eventController)
);
protectedRouter.delete(
  "/events/:id/image",
  eventController.removeEventImage.bind(eventController)
);

// ✅ Edit with base64 image
protectedRouter.put(
  "/events/:id/base64",
  eventController.editEventWithBase64.bind(eventController)
);

// File management routes للملفات الإضافية (وليس الصور)
protectedRouter.delete(
  "/events/:eventId/files/:fileId",
  eventController.removeEventFile.bind(eventController)
);

// Basic CRUD routes
protectedRouter.get("/events", eventController.getEvents.bind(eventController));
protectedRouter.get("/events/:id", eventController.getOne.bind(eventController));

// ✅ Add event with image upload + files
protectedRouter.post(
  "/events",
  upload.fields([
    { name: 'eventImage', maxCount: 1 },
    { name: 'eventFiles', maxCount: 10 }
  ]),
  eventController.addEvent.bind(eventController)
);

// ✅ Edit event with image upload + files  
protectedRouter.put(
  "/events/:id",
  upload.fields([
    { name: 'eventImage', maxCount: 1 },
    { name: 'eventFiles', maxCount: 10 }
  ]),
  eventController.editEvent.bind(eventController)
);

protectedRouter.delete(
  "/events/:id",
  eventController.deleteEvent.bind(eventController)
);

/* ==============================
   DATABASE MANAGEMENT ROUTES
================================ */
protectedRouter.get(
  "/database/backup",
  databaseController.backupDatabase.bind(databaseController)
);

protectedRouter.post(
  "/database/restore",
  databaseController.restoreDatabase.bind(databaseController)
);

protectedRouter.get(
  "/database/download-template",
  databaseController.downloadTemplate.bind(databaseController)
);


/* ==============================
   CONTACT ROUTES (✅ جديد - كامل مثل Products)
================================ */

// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/contacts/export",
  contactController.exportContacts.bind(contactController)
);
protectedRouter.get(
  "/contacts/download-template",
  contactController.downloadTemplate.bind(contactController)
);
protectedRouter.post(
  "/contacts/import",
  contactController.importContacts.bind(contactController)
);

// Status update route (MUST come before /:id)
protectedRouter.patch(
  "/contacts/:id/status",
  contactController.updateContactStatus.bind(contactController)
);

// Basic CRUD routes
protectedRouter.get(
  "/contacts",
  contactController.getContacts.bind(contactController)
);
protectedRouter.get(
  "/contacts/:id",
  contactController.getOneContact.bind(contactController)
);
protectedRouter.post(
  "/contacts",
  contactController.addContact.bind(contactController)
);
protectedRouter.put(
  "/contacts/:id",
  contactController.editContact.bind(contactController)
);
protectedRouter.delete(
  "/contacts/:id",
  contactController.deleteContact.bind(contactController)
);

/* ==============================
   BUSINESS INFO ROUTES (Updated)
================================ */

// Export/Import routes (MUST come before /:id routes)
protectedRouter.get(
  "/business-info/export",
  businessInfoController.exportBusinessInfo.bind(businessInfoController)
);
protectedRouter.get(
  "/business-info/template/download",
  businessInfoController.downloadTemplate.bind(businessInfoController)
);
protectedRouter.post(
  "/business-info/import",
  businessInfoController.importBusinessInfo.bind(businessInfoController)
);
protectedRouter.post(
  "/business-info/:id/import",
  businessInfoController.importBusinessInfo.bind(businessInfoController)
);

// ============================================
// 🟢 ABOUT MAIN SETTINGS (✅ NEW - يجب أن يأتي أولاً)
// ============================================
protectedRouter.put(
  "/business-info/:id/about-settings",
  businessInfoController.updateAboutSettings.bind(businessInfoController)
);

// 🟢 About Sections Management
protectedRouter.post(
  "/business-info/:id/about-sections",
  businessInfoController.addAboutSection.bind(businessInfoController)
);
protectedRouter.put(
  "/business-info/:id/about-sections/:sectionId",
  businessInfoController.updateAboutSection.bind(businessInfoController)
);
protectedRouter.delete(
  "/business-info/:id/about-sections/:sectionId",
  businessInfoController.deleteAboutSection.bind(businessInfoController)
);

// ============================================
// 🟢 REVIEWS MAIN SETTINGS (✅ NEW - Optional)
// ============================================
protectedRouter.put(
  "/business-info/:id/reviews-settings",
  businessInfoController.updateReviewsSettings.bind(businessInfoController)
);

// 🟢 Reviews Management
protectedRouter.post(
  "/business-info/:id/reviews",
  businessInfoController.addReview.bind(businessInfoController)
);
protectedRouter.put(
  "/business-info/:id/reviews/:reviewId",
  businessInfoController.updateReview.bind(businessInfoController)
);
protectedRouter.delete(
  "/business-info/:id/reviews/:reviewId",
  businessInfoController.deleteReview.bind(businessInfoController)
);

// 🟢 Members Management
protectedRouter.post(
  "/business-info/:id/members",
  businessInfoController.addMember.bind(businessInfoController)
);
protectedRouter.put(
  "/business-info/:id/members/:memberId",
  businessInfoController.updateMember.bind(businessInfoController)
);
protectedRouter.delete(
  "/business-info/:id/members/:memberId",
  businessInfoController.deleteMember.bind(businessInfoController)
);

// 🟢 Partners Management
protectedRouter.post(
  "/business-info/:id/partners",
  businessInfoController.addPartner.bind(businessInfoController)
);
protectedRouter.put(
  "/business-info/:id/partners/:partnerId",
  businessInfoController.updatePartner.bind(businessInfoController)
);
protectedRouter.delete(
  "/business-info/:id/partners/:partnerId",
  businessInfoController.deletePartner.bind(businessInfoController)
);

// 🟢 Locations Management
protectedRouter.post(
  "/business-info/:id/locations",
  businessInfoController.addLocation.bind(businessInfoController)
);
protectedRouter.put(
  "/business-info/:id/locations/:locationId",
  businessInfoController.updateLocation.bind(businessInfoController)
);
protectedRouter.delete(
  "/business-info/:id/locations/:locationId",
  businessInfoController.deleteLocation.bind(businessInfoController)
);

// 🟢 Media Upload Routes
protectedRouter.post(
  "/business-info/:id/upload-media",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "aboutHeroImage", maxCount: 1 },
    { name: "reviewsHeroImage", maxCount: 1 },
  ]),
  businessInfoController.uploadMedia.bind(businessInfoController)
);

protectedRouter.post(
  "/business-info/upload-image",
  upload.single("image"),
  businessInfoController.uploadImage.bind(businessInfoController)
);

// Basic CRUD routes (⚠️ يجب أن تأتي في النهاية)
protectedRouter.get(
  "/business-info",
  businessInfoController.getBusinessInfo.bind(businessInfoController)
);
protectedRouter.get(
  "/business-info/:id",
  businessInfoController.getBusinessInfoById.bind(businessInfoController)
);
protectedRouter.post(
  "/business-info",
  businessInfoController.upsertBusinessInfo.bind(businessInfoController)
);
protectedRouter.put(
  "/business-info/:id",
  businessInfoController.upsertBusinessInfo.bind(businessInfoController)
);
export default protectedRouter;