import { Router } from "express";
import ProductController from "../../controllers/products";
import CategoryController from "../../controllers/category";
import OrderController from "../../controllers/orders";
import ConsultationRequestsController from "../../controllers/consultationRequests";
import MaterialRequestController from "../../controllers/materialRequests";
import EventController from "../../controllers/events";
import CustomerController from "../../controllers/customer";

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

/* ==============================
   PUBLIC PRODUCT ROUTES
================================ */
// Get all products (for website display)
publicRouter.get(
  "/products",
  productController.getProducts.bind(productController)
);

// Get single product by ID
publicRouter.get(
  "/products/:id",
  productController.getOneProduct.bind(productController)
);

// Export (if needed for public)
publicRouter.get(
  "/products/export",
  productController.exportProducts.bind(productController)
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

export default publicRouter;