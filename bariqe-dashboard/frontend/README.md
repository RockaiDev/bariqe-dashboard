# Alex Chem Frontend

A modern React-based admin dashboard for Alex Chem, a chemical products management system. This application provides comprehensive management tools for orders, products, customers, consultations, material requests, and reporting.

## 🚀 Features

### Core Functionality
- **Dashboard**: Overview of key metrics and analytics
- **Orders Management**: Complete order lifecycle management
- **Products Management**: Product catalog and inventory control
- **Customers Management**: Customer database and profiles
- **Consultations**: Handle customer consultation requests
- **Material Requests**: Process material procurement requests
- **Reports**: Generate and view business reports
- **Categories**: Organize products by categories
- **Settings**: Application configuration and preferences

### Technical Features
- **Multi-language Support**: English and Arabic translations
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Data**: Powered by React Query for efficient data fetching
- **Form Management**: Robust form handling with React Hook Form and Zod validation
- **Charts & Analytics**: Data visualization with Recharts
- **File Upload**: Excel file processing and image uploads
- **Authentication**: Secure login system with JWT tokens

## 🛠️ Tech Stack

### Frontend Framework
- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### State Management & Data
- **React Query** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Axios** - HTTP client

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── animations/         # Animation utilities
│   ├── assets/            # Images and icons
│   ├── components/
│   │   ├── shared/        # Reusable components
│   │   └── ui/           # UI component library
│   ├── context/           # React contexts
│   ├── helper/            # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   ├── lib/               # Library configurations
│   ├── screens/           # Page components
│   │   ├── Dashboard/
│   │   ├── Orders/
│   │   ├── Products/
│   │   ├── Customers/
│   │   ├── Consultations/
│   │   ├── MaterialRequest/
│   │   ├── Reports/
│   │   ├── Category/
│   │   ├── Settings/
│   │   └── Login/
│   ├── services/          # API service functions
│   ├── translations/      # i18n files (en.json, ar.json)
│   └── types/             # TypeScript type definitions
├── .env                   # Environment variables
├── .gitignore
├── components.json        # shadcn/ui configuration
├── eslint.config.js       # ESLint configuration
├── index.html             # Main HTML template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig*.json         # TypeScript configurations
└── vite.config.ts         # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm or yarn
- Backend API server running (default: http://localhost:4001)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:4001
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview the production build locally

## 🌐 Internationalization

The application supports multiple languages:
- English (en)
- Arabic (ar)

Translation files are located in `src/translations/`. The app automatically detects the user's language preference.

## 🎨 UI Components

Built with shadcn/ui components on top of Radix UI primitives:
- Buttons, inputs, selects, dialogs
- Tables with sorting and filtering
- Charts and progress indicators
- Form components with validation
- Navigation and layout components

## 📊 Data Management

- **React Query**: Efficient server state management with caching
- **Axios**: HTTP client with interceptors for authentication
- **React Hook Form**: Declarative form handling
- **Zod**: Runtime type validation

## 🔒 Authentication

JWT-based authentication system with:
- Login/logout functionality
- Protected routes
- Token refresh mechanism
- Cookie-based token storage

## 📱 Responsive Design

Mobile-first responsive design using Tailwind CSS:
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Optimized performance on mobile devices

## 🧪 Development Guidelines

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Prettier for code formatting (via ESLint)

### Component Structure
- Functional components with hooks
- Custom hooks for business logic
- Shared components for reusability
- Proper TypeScript typing

### State Management
- Local state with useState/useReducer
- Server state with React Query
- Global state with Context API

## 🤝 Contributing

1. Follow the existing code style and conventions
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## 📄 License

This project is proprietary software for Alex Chem.

## 📞 Support

For support or questions, please contact the development team.
