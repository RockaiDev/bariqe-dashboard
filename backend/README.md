# Backend - Bariqe El Tamioz

This is the backend API for the Bariqe El Tamioz application, built with Node.js, Express, TypeScript, and MongoDB.

## Features

- RESTful API with Express.js
- TypeScript for type safety
- MongoDB with Mongoose ODM
- JWT authentication
- File uploads with Cloudinary
- Excel file processing
- Stripe payment integration
- Email notifications with Nodemailer

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Cloudinary account for file uploads
- Stripe account for payments

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root of the backend directory with the following variables:
   ```env
   MONGO_URI=mongodb+srv://your-mongo-connection-string
   PORT=4001
   JWT=your-jwt-secret-key
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

4. Build the project:
   ```bash
   npm run build
   ```

### Running the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 4001).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `PORT` | Server port number | No (default: 4001) |
| `JWT` | JWT secret key for authentication | Yes |
| `NODE_ENV` | Environment mode (development/production) | No (default: development) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |

## API Endpoints

The API provides endpoints for:
- User authentication and authorization
- Product management
- Order processing
- Customer management
- Material requests
- Dashboard analytics
- File uploads

## Project Structure

```
backend/
├── app.ts                 # Main application entry point
├── config/
│   └── db.ts             # Database configuration
├── controllers/          # Route controllers
├── middlewares/          # Custom middleware
├── models/              # Mongoose schemas
├── routes/              # API routes
├── services/            # Business logic services
├── utils/               # Utility functions
├── uploads/             # Uploaded files directory
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm run seed` - Run database seeder
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Create pull requests with clear descriptions

## License

This project is licensed under the ISC License.
