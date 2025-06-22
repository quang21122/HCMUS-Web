# G News Website

A comprehensive news management system built with Node.js, Express, and MongoDB. This web application provides a complete platform for news publishing, content management, and user interaction with role-based access control.

## 🌐 Live Demo

**Website URL:** [https://hcmus-web.onrender.com/](https://hcmus-web.onrender.com/)

## 📋 Project Overview

G News Website is a full-featured news platform that supports multiple user roles including guests, subscribers, writers, editors, and administrators. The system provides comprehensive content management capabilities, user authentication, article publishing workflows, and interactive features like commenting and search functionality.

## 🛠️ Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **Nodemailer** - Email functionality

### Frontend

- **EJS** - Template engine
- **TailwindCSS** - Utility-first CSS framework
- **JavaScript** - Client-side scripting
- **Puppeteer** - PDF generation and web scraping

### Development Tools

- **Nodemon** - Development server with auto-restart
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **Livereload** - Live browser refresh during development

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── cache.js      # Caching configuration
│   ├── db.js         # MongoDB connection
│   ├── passport.js   # Authentication strategies
│   └── session.js    # Session configuration
├── controllers/      # Request handlers
│   ├── articleController.js
│   └── userController.js
├── models/           # Database schemas
│   ├── Article.js    # Article model
│   ├── User.js       # User model
│   ├── Category.js   # Category model
│   ├── Tag.js        # Tag model
│   ├── Comment.js    # Comment model
│   └── ...
├── routes/           # Route definitions
│   ├── api/          # API routes
│   └── web/          # Web routes
├── services/         # Business logic
│   ├── articleService.js
│   ├── userService.js
│   ├── categoryService.js
│   └── ...
├── views/            # EJS templates
│   ├── layouts/      # Layout templates
│   ├── pages/        # Page templates
│   └── partials/     # Reusable components
├── public/           # Static assets
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side JavaScript
│   ├── images/       # Static images
│   └── uploads/      # User uploaded files
└── server.js         # Application entry point
```

## ✨ Features

### User Management

- **Multi-role Authentication**: Guest, Subscriber, Writer, Editor, Administrator
- **Google OAuth Integration**: Social login support
- **Email Verification**: Account verification system
- **Password Reset**: Secure password recovery
- **Profile Management**: User profile customization

### Content Management

- **Article Creation**: Rich text editor with image upload
- **Category Management**: Hierarchical category system
- **Tag System**: Article tagging and filtering
- **Draft System**: Save and edit drafts before publishing
- **Article Approval Workflow**: Editor review and approval process

### Publishing Features

- **Premium Content**: Subscription-based premium articles
- **Article Views Tracking**: View count and trending articles
- **Search Functionality**: Full-text search across articles
- **Comment System**: User engagement through comments
- **PDF Export**: Article export to PDF format

### Administrative Features

- **User Management**: Admin panel for user administration
- **Content Moderation**: Article approval and rejection
- **Category Management**: Create and manage article categories
- **Tag Management**: Organize and manage article tags
- **Analytics**: Article views and user engagement metrics

## 🚀 Installation Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd HCMUS-Web/src
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the src directory:

   ```env
   SESSION_SECRET=your-session-secret-key
   MONGODB_URI=your-mongodb-connection-string
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   EMAIL_USER=your-email-address
   EMAIL_PASS=your-email-password
   ```

4. **Database Setup**

   - Ensure MongoDB is running
   - The application will automatically create necessary indexes

5. **Build CSS**
   ```bash
   npm run build:css
   ```

## 🎯 Usage Instructions

### Development Mode

Run the application in development mode with auto-reload:

```bash
npm run dev
```

### Production Mode

Start the application in production:

```bash
npm start
```

The application will be available at `http://localhost:3000`

### CSS Development

For frontend development, run CSS build in watch mode:

```bash
npm run build:css
```

## 📚 API Documentation

### Article API Endpoints

- `POST /api/articles` - Create new article
- `GET /api/articles/:id` - Get article by ID
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `POST /api/articles/import` - Import articles from external source

### User API Endpoints

- `POST /api/users` - Create new user
- `GET /api/users?_id=:id` - Get user by ID
- `PUT /api/users?_id=:id` - Update user
- `DELETE /api/users?_id=:id` - Delete user

### Authentication Routes

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/google` - Google OAuth login
- `POST /auth/logout` - User logout

## 🤝 Contributing Guidelines

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Follow coding standards**
   - Use consistent indentation
   - Add comments for complex logic
   - Follow existing naming conventions
5. **Test your changes**
6. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

## 📄 License

This project is developed as part of the HCMUS Web Development course. Please refer to the course guidelines for usage and distribution terms.

## 👥 Contributors

This project was developed by **Team 3** for the HCMUS Web Development course.

### Team Members

| Name            |  GitHub                             | 
| --------------- |------------------------------------ | 
| Duy     | [@howtobefun](http://github.com/howtobefun) |
| Dương | [@duongngo164](https://github.com/duongngo164)       | 
| T.Thiện | [@thien-vu-newbie](https://github.com/thien-vu-newbie)       | 
| Quang | [@quang21122](https://github.com/quang21122)       | 
| Đ.Thiện | [@thienbanho](https://github.com/thienbanho)       |

## 🐛 Known Issues

- Ensure MongoDB connection is stable for optimal performance
- Large file uploads may require server configuration adjustments
- Email functionality requires proper SMTP configuration

## 📞 Support

For support and questions, please refer to the course materials or contact the development team through the course platform.
