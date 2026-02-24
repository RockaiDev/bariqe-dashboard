

export enum Directions {
    RTL = "rtl",
    LTR = "ltr",
  }
  
  export enum Languages {
    ENGLISH = "en",
    ARABIC = "ar",
  }
  
  export enum Routes {
    ROOT = `/`,
    MENU = "menu",
    ABOUT = "about",
    CONTACT = "contact",
    CART = "cart",
    WISHLIST = "wishlist",
    CHECKOUT = "checkout",
    PRODUCT = "public/product",
    PRODUCTS = "public/products",
    CATEGORY = "public/category",
    CATEGORIES = "public/categories",
    PROFILE = "profile",
    ADMIN = "admin",
    DASHBOARD = "dashboard",
    USERS = "users",
    ORDERS = "profile/orders",
    REGISTER = "auth/signup",
    LOGIN = "auth/signin",
    FORGOT_PASSWORD = "auth/forgot-password",
    RESET_PASSWORD = "auth/reset-password",
    ADMIN_DASHBOARD = "admin/dashboard/",
    ADMIN_PRODUCTS = "admin/dashboard/products",
    ADMIN_ORDERS = "admin/dashboard/orders",
    ADMIN_USERS = "admin/dashboard/users",
    ADMIN_CATEGORIES = "admin/dashboard/categories",
    ADMIN_CATEGORY = "admin/dashboard/category",
    ADMIN_PRODUCT = "admin/dashboard/product",
    ADMIN_ORDER = "admin/dashboard/order",
    ADMIN_USER = "admin/dashboard/user",
    ADMIN_COUPONS = "admin/dashboard/coupons",
    ADMIN_CUSTOMIZE = "admin/dashboard/customize",
    RESEND_VERIFICATION = "auth/verify-email"
  }
  
  export enum Pages {
    HOME = "home",
    LOGIN = "signin",
    REGISTER = "signup",
    FORGOT_PASSWORD = "forgot-password",
    CATEGORIES = "categories",
    MENU_ITEMS = "menu-items",
    USERS = "users",
    ORDERS = "orders",
    PRODUCTS = "products",
    PRODUCT = "product",
    CART = "cart",
    CHECKOUT = "checkout",
    WISHLIST = "wishlist",
    PROFILE = "profile",
    ADMIN = "admin",
    NEW = "new",
    EDIT = "edit",
    CONTACT = "contact",
    ABOUT = "about",
    RESET_PASSWORD = "reset-password",
  }
  
  export enum InputTypes {
    TEXT = "text",
    EMAIL = "email",
    PASSWORD = "password",
    NUMBER = "number",
    DATE = "date",
    TIME = "time",
    DATE_TIME_LOCAL = "datetime-local",
    CHECKBOX = "checkbox",
    RADIO = "radio",
    SELECT = "select",
    TEXTAREA = "textarea",
    FILE = "file",
    IMAGE = "image",
    COLOR = "color",
    RANGE = "range",
    TEL = "tel",
    URL = "url",
    SEARCH = "search",
    MONTH = "month",
    WEEK = "week",
    HIDDEN = "hidden",
    MULTI_SELECT = "multi select",
  }
  
  export enum Navigate {
    NEXT = "next",
    PREV = "prev",
  }
  export enum Responses {
    SUCCESS = "success",
    ERROR = "error",
    WARNING = "warning",
    INFO = "info",
  }
  
  export enum SortOrder {
    ASC = "asc",
    DESC = "desc",
  }
  
  export enum SortBy {
    CREATED_AT = "createdAt",
    UPDATED_AT = "updatedAt",
    NAME = "name",
    EMAIL = "email",
    PHONE = "phone",
    STATUS = "status",
    START_DATE = "startDate",
    END_DATE = "endDate",
  }
  
  export enum AuthMessages {
    LOGIN_SUCCESS = "Login successfully",
    LOGOUT_SUCCESS = "Logout successfully",
    REGISTER_SUCCESS = "Register successfully",
    FORGET_PASSWORD_SUCCESS = "Forget password successfully",
    RESET_PASSWORD_SUCCESS = "Reset password successfully",
  }
  
  export enum Methods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE",
  }
  
  export enum Environments {
    PROD = "production",
    DEV = "development",
  }
  export enum UserRole {
    USER = "user",
    ADMIN = "admin",
  }
