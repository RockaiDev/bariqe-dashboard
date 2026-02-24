# BariqeWeb Project

## 1. Overview

This project is a modern, full-featured web application developed for Bariqe. Built with Next.js and TypeScript, the application is designed to be performant, SEO-friendly, and provide a seamless user experience. It serves as the company's digital presence, showcasing its products, events, and corporate information while offering multiple ways for customers to get in touch.

## 2. Tech Stack

The project leverages a modern technology stack to ensure scalability, maintainability, and a high-quality user interface.

- **Framework:** [Next.js](https://nextjs.org/) (with Turbopack) for server-side rendering, static site generation, and a robust React foundation.
- **Language:** [TypeScript](https://www.typescriptlang.org/) for static typing, improving code quality and developer experience.
- **Styling & UI:**
  - [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid and custom UI development.
  - [Radix UI](https://www.radix-ui.com/): For unstyled, accessible, and highly customizable UI primitives, used via `shadcn/ui`.
  - [Framer Motion](https://www.framer.com/motion/): For creating fluid animations and complex gestures.
  - [Lucide React](https://lucide.dev/): A comprehensive and modern icon library.
- **State & Data Management:**
  - [TanStack React Query](https://tanstack.com/query/latest): For efficient data fetching, caching, and synchronization.
  - [Axios](https://axios-http.com/): A promise-based HTTP client for making API requests.
- **Forms:**
  - [React Hook Form](https://react-hook-form.com/): For building performant and flexible forms.
  - [Zod](https://zod.dev/): For schema declaration and validation, ensuring data integrity.
- **Internationalization (i18n):**
  - `next-intl`: To provide multi-language support (Arabic and English).
- **Mapping:**
  - [React Leaflet](https://react-leaflet.js.org/): For integrating interactive and customizable maps.
- **Other Key Libraries:**
  - `xlsx`: For handling and parsing Excel files.
  - `moment`: For robust date and time manipulation.
  - `class-variance-authority`, `clsx`, `tailwind-merge`: Utilities for managing component variants and conditional classes.

## 3. Key Features

The application is rich with features designed to meet the needs of Bariqe and its customers.

- **Bilingual Support:** Fully internationalized to support both English and Arabic, providing a native experience for a broader audience.
- **Product Catalogue:** A comprehensive section for showcasing products, complete with search, filtering, and detailed product pages.
- **Event Management:** A dedicated module to list upcoming and past events, allowing users to stay informed about company activities.
- **Informative Pages:** Static pages like "About Us" and "Why Choose Us" to provide context and build trust with users.
- **Interactive Contact Form:** A user-friendly contact form integrated with an interactive map (Leaflet) to display the company's location.
- **Responsive Design:** The UI is fully responsive, ensuring a consistent and optimal experience across all devices (desktops, tablets, and mobile phones).
- **Enhanced User Experience:** Implements loading states (e.g., skeletons, spinners) to provide visual feedback and improve perceived performance during data fetching operations.

## 4. Project Structure

The project follows the Next.js App Router paradigm, promoting a modular and organized codebase. The `src` directory is the heart of the application.

-   **`src/app/[locale]/`**: This is the main routing directory for the Next.js App Router.
    -   `layout.tsx`: The root layout for the application, wrapping all pages.
    -   `page.tsx`: The component for the homepage.
    -   `globals.css`: Global styles imported into the layout.
    -   **Route-specific directories** (e.g., `about/`, `catalogue/`, `contact/`): Each directory represents a route segment. It contains a `page.tsx` file for the route and a `_components/` subdirectory for components used exclusively on that page.

-   **`src/components/`**: Contains all reusable React components, organized by feature or purpose.
    -   `home/`: Components used specifically on the homepage (e.g., `Hero`, `FeaturedCategories`).
    -   `products/`: Components related to product display (e.g., `ProductCard`, `SearchBar`).
    -   `shared/`: Components used across multiple pages (e.g., `Header`, `Footer`, `Modal`).
    -   `ui/`: Low-level, generic UI elements, largely based on `shadcn/ui` (e.g., `Button`, `Card`, `Input`, `Dialog`).

-   **`src/constants/`**: Stores application-wide constant values, such as enums (`enums.ts`), to maintain consistency.

-   **`src/hooks/`**: Holds custom React hooks that encapsulate and reuse stateful logic.
    -   `useCrud.ts`: A hook for handling CRUD operations.
    -   `useTranslations.ts`: A hook from `next-intl` for accessing translation strings.
    -   `usePageLoading.ts`: Manages the global page loading state.

-   **`src/i18n/`**: Configures the internationalization setup provided by `next-intl`, including middleware integration and routing.

-   **`src/lib/`**: Contains core logic, utility functions, and configurations for third-party libraries.
    -   `utils.ts`: A collection of general-purpose helper functions.
    -   `publicApiService.ts` & `publicAxiosInstance.ts`: The service layer for making API calls, built on top of Axios.
    -   `queryKeys.ts`: Defines the keys used by TanStack React Query for caching.
    -   `data/`: Contains static or mock data used in the application.

-   **`src/providers/`**: Contains React Context providers that supply global state or functionality to the entire application (e.g., `QueryProvider`, `LoadingProvider`).

-   **`src/styles/`**: Includes global or base styles that are not covered by Tailwind's utility classes.

-   **`src/types/`**: Defines custom TypeScript types and interfaces used throughout the project.

-   **`messages/`**: Contains the JSON files with translation strings for each supported language (`en.json`, `ar.json`).

-   **`public/`**: Stores all static assets, such as images, logos, and other files that are served directly by the browser.

## 5. Getting Started

To run the project locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.
