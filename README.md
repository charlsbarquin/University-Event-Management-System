# University Event Management System (UEMS)

A comprehensive web-based platform designed to streamline event management within universities. This system facilitates the creation, approval, and management of university events while providing role-based access for students, organizers, and administrators.

## 🌟 Live Deployment

### **Live Application URLs:**
- **🌐 Frontend (User Interface):** [https://uems-frontend.onrender.com](https://uems-frontend.onrender.com)
- **🔧 Backend API:** [https://uems-backend-epbe.onrender.com/api](https://uems-backend-epbe.onrender.com/api)
- **📊 Health Check:** [https://uems-backend-epbe.onrender.com/api/health](https://uems-backend-epbe.onrender.com/api/health)

### **Demo Credentials:**
- **Student Role:** STU001 / password123
- **Organizer Role:** ORG001 / password123
- **Admin Role:** ADMIN001 / admin123

## 🚀 Features

### User Management
- **Role-Based Authentication**: Three user roles - Student, Organizer, and Admin
- **Secure Registration & Login**: JWT-based authentication with password hashing
- **Profile Management**: User profiles with personal information and profile pictures

### Event Management
- **Event Creation**: Students can propose events with detailed information
- **Approval Workflow**: Admin review and approval process for event proposals
- **Event Categories**: Academic, Cultural, Sports, Workshop, Seminar, Social, and Other
- **Multimedia Support**: Upload banners, images, and videos for events
- **Registration System**: Attendee registration with capacity limits
- **Event Status Tracking**: Draft, Pending, Approved, Rejected, Cancelled statuses

### Administrative Features
- **Dashboard Analytics**: Comprehensive admin dashboard with system statistics
- **User Management**: Admin controls for user roles and permissions
- **Event Oversight**: Full control over event approvals and modifications
- **System Monitoring**: Health checks and rate limiting

### Additional Features
- **Notifications**: Real-time notifications for event updates and approvals
- **Social Sharing**: Shareable links for approved events
- **File Upload**: Secure file upload system with validation
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Search & Filtering**: Advanced event browsing with filters

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18.x) on Render
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing, Helmet for security headers
- **File Upload**: Multer with memory storage for production
- **Rate Limiting**: express-rate-limit for API protection
- **CORS**: Configurable Cross-Origin Resource Sharing

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form
- **UI Components**: Headless UI, Lucide React icons
- **Notifications**: React Hot Toast
- **Data Fetching**: TanStack Query (React Query)
- **Minification**: Terser for production builds

### Deployment & Hosting
- **Cloud Platform**: Render.com (Web Service + Static Site)
- **Database Hosting**: MongoDB Atlas (Free Tier)
- **CDN**: Render CDN for static assets
- **SSL/TLS**: Automated HTTPS via Render
- **Monitoring**: Render dashboard with health checks

### Development Tools
- **Version Control**: Git
- **Testing**: Jest (Backend)
- **Process Management**: Nodemon for development
- **Build Tool**: Vite for frontend bundling
- **Linting**: ESLint
- **Package Management**: npm

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or cloud instance like MongoDB Atlas)
- **npm** or **yarn** package manager
- **Git** for version control

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/charlsbarquin/University-Event-Management-System.git
cd University-Event-Management-System/University-Event-Management-System
```

### 2. Backend Setup
```bash
cd uems-backend
npm install
```

### 3. Frontend Setup
```bash
cd ../uems-frontend
npm install
```

## ⚙️ Environment Configuration

### Backend Environment Variables
Create a `.env` file in the `uems-backend` directory:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/uems

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4
```

### Frontend Environment Variables
Create a `.env` file in the `uems-frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Production Environment (Render)
These are configured in Render dashboard:

**Backend Service:**
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uems_database
JWT_SECRET=production-jwt-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=https://uems-frontend.onrender.com
CLIENT_URL=https://uems-frontend.onrender.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend Static Site:**
```env
VITE_API_BASE_URL=https://uems-backend-epbe.onrender.com/api
```

## 🚀 Running the Application

### Development Mode

1. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

2. **Start Backend Server**:
   ```bash
   cd uems-backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

3. **Start Frontend Development Server**:
   ```bash
   cd uems-frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

### Production Build

1. **Build Frontend**:
   ```bash
   cd uems-frontend
   npm run build
   ```

2. **Start Backend in Production**:
   ```bash
   cd uems-backend
   npm start
   ```

## 📁 Project Structure

```
university-event-management-system/
├── uems-backend/                 # Backend API
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/             # Route controllers
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── adminController.js
│   │   └── ...
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/                  # Mongoose models
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── ...
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── ...
│   ├── scripts/                 # Utility scripts
│   ├── uploads/                 # File uploads directory
│   ├── server.js                # Main server file
│   └── package.json
├── uems-frontend/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── contexts/            # React contexts
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service functions
│   │   ├── utils/               # Utility functions
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── package.json                 # Root package file
└── README.md                    # This file
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Event Proposals
- `GET /api/events/proposals` - Get pending proposals
- `PUT /api/events/proposals/:id/approve` - Approve proposal
- `PUT /api/events/proposals/:id/reject` - Reject proposal

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/analytics` - Get system analytics

### Uploads
- `POST /api/upload/images` - Upload images
- `POST /api/upload/videos` - Upload videos

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**Bicol University Polangui - BS Information System 3A**

- Developed as a final project for Framework/No SQL Technology.

## 📞 Support

For support, email [cecb2023-3381-92168@bicol-u.edu.ph] or create an issue in this repository.

## 🔄 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Calendar integration
- [ ] Event feedback and ratings system
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Integration with university systems (SIS, LMS)

---

**Note**: This system is designed for educational institutions and can be customized according to specific university requirements.
