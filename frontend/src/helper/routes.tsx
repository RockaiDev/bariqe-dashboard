import {
  CategoryPage,
  ConsultationsPage,
  CustomersPage,
  Dashboard,
  ErrorPage,
  HelpPage,
  LoginPage,
  MaterialRequestPage,
  OrdersPage,
  ProductsPage,
  ReportsPage,
  SettingsPage,
} from "@/screens";
import type { RouteObject } from "react-router-dom";

const globalRoutes: RouteObject[] = [
  {
    path: "*",
    element: <ErrorPage />,
  },
];

const authenticationRoutes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },

  ...globalRoutes,
];

const routes: RouteObject[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/customers",
    element: <CustomersPage />,
  },
  {
    path: "/category",
    element: <CategoryPage />,
  },
  {
    path: "/products",
    element: <ProductsPage />,
  },
  {
    path: "/material-requests",
    element: <MaterialRequestPage />,
  },
  {
    path: "/orders",
    element: <OrdersPage />,
  },
  {
    path: "/consultations",
    element: <ConsultationsPage />,
  },
  {
    path: "/reports",
    element: <ReportsPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  }
  ,  {
    path: "/help",
    element: <HelpPage />,
  },

  ...globalRoutes,
];

const names: any[] = [];

export { globalRoutes, authenticationRoutes, routes, names };
