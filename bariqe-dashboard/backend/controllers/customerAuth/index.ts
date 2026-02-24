import { NextFunction, Request, Response } from "express";
import BaseApi from "../../utils/BaseApi";
import CustomerAuthService from "./services";
import { COOKIE_OPTIONS } from "../auth";

const authService = new CustomerAuthService();

export default class CustomerAuthController extends BaseApi {
  
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.Register(req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.VerifyOTP(req.body);
      res.cookie("accessToken", result.token, { ...COOKIE_OPTIONS, httpOnly: true });
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.ResendOTP(req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.Login(req.body);
      res.cookie("accessToken", result.token, { ...COOKIE_OPTIONS, httpOnly: true });
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("accessToken", { ...COOKIE_OPTIONS, httpOnly: true } as any);
      super.send(res, { message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.ForgotPassword(req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.ResetPassword(req.body);
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.SocialLogin({ ...req.body, provider: 'google' });
      res.cookie("accessToken", result.token, { ...COOKIE_OPTIONS, httpOnly: true });
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }

  public async appleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.SocialLogin({ ...req.body, provider: 'apple' });
      res.cookie("accessToken", result.token, { ...COOKIE_OPTIONS, httpOnly: true });
      super.send(res, result);
    } catch (error) {
      next(error);
    }
  }
}
