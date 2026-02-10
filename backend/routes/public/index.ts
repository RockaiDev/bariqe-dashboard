import { Router } from "express";
import ProductController from "../../controllers/products";
import CategoryController from "../../controllers/category";
import OrderController from "../../controllers/orders";
import ConsultationRequestsController from "../../controllers/consultationRequests";
import MaterialRequestController from "../../controllers/materialRequests";
import EventController from "../../controllers/events";
import CustomerController from "../../controllers/customer";
import ContactController from '../../controllers/contact/index';
import BusinessInfoController from "../../controllers/businessInfo";
import CustomerAuthController from "../../controllers/customerAuth";

// Initialize public routes
const publicRouter = Router();

// Controllers
const productController = new ProductController();
const categoryController = new CategoryController();
const orderController = new OrderController();
const consultationRequestsController = new ConsultationRequestsController();
const materialRequestController = new MaterialRequestController();
const eventController = new EventController();
const customerController = new CustomerController();
const contactController = new ContactController();

const businessInfoController = new BusinessInfoController();
const customerAuthController = new CustomerAuthController();
/* ==============================
   PUBLIC PRODUCT ROUTES
================================ */

// ✅ Export route (MUST come FIRST - before /:id)
publicRouter.get(
  "/products/export",
  productController.exportProducts.bind(productController)
);

// Get all products (for website display)
publicRouter.get(
  "/products",
  productController.getProducts.bind(productController)
);

// ✅ Get single product by ID (MUST come LAST)
publicRouter.get(
  "/products/:id",
  productController.getOneProduct.bind(productController)
);

/* ==============================
   PUBLIC CATEGORY ROUTES
================================ */
// 🟢 Get active categories only (for website navigation)
publicRouter.get(
  "/categories/active",
  categoryController.getActiveCategories.bind(categoryController)
);

// 🟢 Get category statistics (for website display)
publicRouter.get(
  "/categories/stats",
  categoryController.getCategoryStats.bind(categoryController)
);

// 🟢 Get subcategories for a specific category (for website navigation)
publicRouter.get(
  "/categories/:categoryId/subcategories",
  categoryController.getSubCategories.bind(categoryController)
);

// Get all categories (for website navigation)
publicRouter.get(
  "/categories",
  categoryController.getCategories.bind(categoryController)
);

// Get single category by ID
publicRouter.get(
  "/categories/:id",
  categoryController.getOne.bind(categoryController)
);

/* ==============================
   PUBLIC ORDER ROUTES
================================ */
// Create new order (customer can place order without login)
publicRouter.post(
  "/orders",
  orderController.addOrder.bind(orderController)
);

// ✅ NEW: Initiate Checkout (Facade Pattern)
// Creates order + payment invoice, returns payment URL
publicRouter.post(
  "/orders/checkout",
  orderController.initiateCheckout.bind(orderController)
);

// ✅ NEW: PayLink Webhook Callback
// Called by PayLink when payment is completed/failed
publicRouter.post(
  "/orders/webhook/paylink",
  orderController.handlePaylinkWebhookFacade.bind(orderController)
);

// ✅ PayLink GET Callback (PayLink redirects the user back via GET with query params)
publicRouter.get(
  "/orders/webhook/paylink",
  orderController.handlePaylinkWebhookFacade.bind(orderController)
);

// Get order by ID (customer can track order with ID)
publicRouter.get(
  "/orders/:id",
  orderController.getOne.bind(orderController)
);

/* ==============================
   PUBLIC CONSULTATION ROUTES
================================ */
// Create consultation request
publicRouter.post(
  "/consultation-requests",
  consultationRequestsController.add.bind(consultationRequestsController) // تصحيح الـ binding
);

// Get consultation by ID
publicRouter.get(
  "/consultation-requests/:id",
  consultationRequestsController.getOne.bind(consultationRequestsController) // تصحيح الـ binding
);

/* ==============================
   PUBLIC MATERIAL REQUEST ROUTES
================================ */
// Create material request
publicRouter.post(
  "/material-requests",
  materialRequestController.add.bind(materialRequestController) // تصحيح الـ binding
);

// Get material request by ID
publicRouter.get(
  "/material-requests/:id",
  materialRequestController.getOne.bind(materialRequestController) // تصحيح الـ binding
);

/* ==============================
   PUBLIC EVENT ROUTES
================================ */
publicRouter.get(
  "/events",
  eventController.getEvents.bind(eventController)
);

publicRouter.get(
  "/events/:id",
  eventController.getOne.bind(eventController)
);
publicRouter.get(
  "/events/:eventId/files/:fileId/download",
  eventController.downloadEventFile.bind(eventController)
);

publicRouter.get(
  "/events/:eventId/files/:fileId/preview",
  eventController.previewEventFile.bind(eventController)
);

publicRouter.get(
  "/events/:eventId/files/:fileId/info",
  eventController.getFileInfo.bind(eventController)
);
/* ==============================
   PUBLIC CUSTOMER AUTH ROUTES (New)
================================ */
publicRouter.post(
  "/customer/register",
  customerAuthController.register.bind(customerAuthController)
);

publicRouter.post(
  "/customer/verify-otp",
  customerAuthController.verifyOtp.bind(customerAuthController)
);

publicRouter.post(
  "/customer/resend-otp",
  customerAuthController.resendOtp.bind(customerAuthController)
);

publicRouter.post(
  "/customer/login",
  customerAuthController.login.bind(customerAuthController)
);

publicRouter.post(
  "/customer/logout",
  customerAuthController.logout.bind(customerAuthController)
);

publicRouter.post(
  "/customer/forgot-password",
  customerAuthController.forgotPassword.bind(customerAuthController)
);

publicRouter.post(
  "/customer/reset-password",
  customerAuthController.resetPassword.bind(customerAuthController)
);

publicRouter.post(
  "/customer/google",
  customerAuthController.googleLogin.bind(customerAuthController)
);

publicRouter.post(
  "/customer/apple",
  customerAuthController.appleLogin.bind(customerAuthController)
);

/* ==============================
   PUBLIC CUSTOMER ROUTES
================================ */
publicRouter.get(
  "/customers",
  customerController.getCustomers.bind(customerController)
);

publicRouter.get(
  "/customers/:id",
  customerController.getOne.bind(customerController)
);

publicRouter.post(
  "/customers",
  customerController.addCustomer.bind(customerController)
);

publicRouter.patch(
  "/customers/:id",
  customerController.editCustomer.bind(customerController)
);

/* ==============================
   PUBLIC CONTACT ROUTES (✅ جديد)
================================ */
// Create contact request (anyone can submit contact form)
publicRouter.post(
  "/contacts",
  contactController.addContact.bind(contactController)
);

// Get contact by ID (to check submission status)
publicRouter.get(
  "/contacts/:id",
  contactController.getOneContact.bind(contactController)
);
/* ==============================
   PUBLIC BUSINESS INFO ROUTES (Updated)
================================ */

// Get active business info (for website)
publicRouter.get(
  "/business-info",
  businessInfoController.getBusinessInfo.bind(businessInfoController)
);

// Get business info by ID
publicRouter.get(
  "/business-info/:id",
  businessInfoController.getBusinessInfoById.bind(businessInfoController)
);

// 🟢 Get About Sections only (for About Us page)
publicRouter.get(
  "/business-info/:id/about",
  async (req, res, next) => {
    try {
      const businessInfo = await businessInfoController.getBusinessInfoById(
        req,
        res,
        next
      );
      // This will be handled by the controller
    } catch (err) {
      next(err);
    }
  }
);

// 🟢 Get Reviews only (for Testimonials page)
publicRouter.get(
  "/business-info/:id/reviews",
  async (req, res, next) => {
    try {
      const businessInfo = await businessInfoController.getBusinessInfoById(
        req,
        res,
        next
      );
      // This will be handled by the controller
    } catch (err) {
      next(err);
    }
  }
);

export default publicRouter;