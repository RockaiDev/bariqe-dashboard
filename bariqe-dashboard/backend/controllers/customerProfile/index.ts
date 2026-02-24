import { NextFunction, Request, Response } from "express";
import BaseApi from "../../utils/BaseApi";
import CustomerProfileService from "./services";

const profileService = new CustomerProfileService();

export default class CustomerProfileController extends BaseApi {
  
  // Profile
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const result = await profileService.getProfile(customerId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const result = await profileService.updateProfile(customerId, req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Addresses
  public async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const result = await profileService.getAddresses(customerId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const result = await profileService.addAddress(customerId, req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const addressId = req.params.id;
      const result = await profileService.updateAddress(customerId, addressId, req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const addressId = req.params.id;
      const result = await profileService.deleteAddress(customerId, addressId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Favorites
  public async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const result = await profileService.getFavorites(customerId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const productId = req.params.productId;
      const result = await profileService.addFavorite(customerId, productId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const productId = req.params.productId;
      const result = await profileService.removeFavorite(customerId, productId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  // Orders
  public async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = (req as any).user.id;
      const result = await profileService.getMyOrders(customerId);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }
}
