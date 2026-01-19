import { Router } from "express";
import CustomerProfileController from "../../controllers/customerProfile";

const customerRouter = Router();
const profileController = new CustomerProfileController();

// === Profile ===
customerRouter.get("/profile", profileController.getProfile.bind(profileController));
customerRouter.patch("/profile", profileController.updateProfile.bind(profileController)); // Should probably handle avatar upload here too, using multer

// === Addresses ===
customerRouter.get("/addresses", profileController.getAddresses.bind(profileController));
customerRouter.post("/addresses", profileController.addAddress.bind(profileController));
customerRouter.patch("/addresses/:id", profileController.updateAddress.bind(profileController));
customerRouter.delete("/addresses/:id", profileController.deleteAddress.bind(profileController));

// === Favorites ===
customerRouter.get("/favorites", profileController.getFavorites.bind(profileController));
customerRouter.post("/favorites/:productId", profileController.addFavorite.bind(profileController));
customerRouter.delete("/favorites/:productId", profileController.removeFavorite.bind(profileController));

// === Orders ===
customerRouter.get("/orders", profileController.getMyOrders.bind(profileController));

export default customerRouter;
