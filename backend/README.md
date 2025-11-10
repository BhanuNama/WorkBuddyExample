# WorkBuddy Backend API

This is the backend API for the WorkBuddy Employee-Manager Application built with Node.js, Express, and MongoDB.

## 📁 Project Structure

```
backend/
├── config/
│   ├── config.js              # Configuration settings
│   └── database.js            # MongoDB connection
├── controllers/
│   ├── userController.js      # User authentication controllers
│   └── leaveRequestController.js  # Leave request CRUD controllers
├── models/
│   ├── userModel.js           # User schema
│   └── leaveRequestModel.js   # Leave request schema
├── routes/
│   ├── userRoutes.js          # User routes
│   └── leaveRequestRoutes.js  # Leave request routes
├── utils/
│   └── authUtils.js           # JWT generation and validation
├── server.js                  # Main server file
└── package.json               # Dependencies
```

## 🚀 Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Make sure MongoDB is running locally:**
   ```bash
   # Start MongoDB (if not already running)
   mongod
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

The application uses the following default configuration:
- **Port:** 3000
- **MongoDB URI:** mongodb://localhost:27017/WorkBuddy
- **JWT Secret:** asdfgewlnclnlhjkl
- **JWT Expiry:** 1h

You can modify these settings in `config/config.js`.

## 📡 API Endpoints

### User Authentication (No token required)

#### 1. Register User
- **URL:** `POST /api/user/register`
- **Body:**
  ```json
  {
    "userName": "john_doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "password": "password123",
    "role": "employee"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "message": "User registered successfully",
    "userId": "64abc123..."
  }
  ```

#### 2. Login User
- **URL:** `POST /api/user/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "userName": "john_doe",
    "role": "employee",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "id": "64abc123..."
  }
  ```

### Leave Request Management (Token required)

**Note:** All leave request endpoints require Bearer token authentication.
Add the token in the Authorization header: `Bearer <your_token>`

#### 3. Get All Leave Requests
- **URL:** `POST /api/leave/getAllLeaveRequests`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "page": 1,
    "limit": 10,
    "search": "",
    "sortBy": "appliedDate",
    "sortOrder": "desc"
  }
  ```
- **Response:** 200 OK

#### 4. Get Leave Request by ID
- **URL:** `GET /api/leave/getLeaveRequestById/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** 200 OK

#### 5. Add New Leave Request
- **URL:** `POST /api/leave/addLeaveRequest`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "userId": "64abc123...",
    "employeeName": "John Doe",
    "leaveType": "Sick Leave",
    "startDate": "2024-01-15",
    "endDate": "2024-01-17",
    "numberOfDays": 3,
    "reason": "Medical treatment"
  }
  ```
- **Response:** 200 OK

#### 6. Update Leave Request
- **URL:** `PUT /api/leave/updateLeaveRequest/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "Approved",
    "managerComments": "Approved for medical reasons"
  }
  ```
- **Response:** 200 OK

#### 7. Get Leave Requests by User ID
- **URL:** `GET /api/leave/getLeaveRequestsByUserId/:userId`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** 200 OK

#### 8. Delete Leave Request
- **URL:** `DELETE /api/leave/deleteLeaveRequest/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** 200 OK

## 🗄️ Database Schema

### User Model
```javascript
{
  userName: String (required, unique),
  email: String (required, unique),
  mobile: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['employee', 'manager', 'admin']),
  timestamps: true
}
```

### Leave Request Model
```javascript
{
  userId: ObjectId (ref: User, required),
  employeeName: String (required),
  leaveType: String (enum: ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Other']),
  startDate: Date (required),
  endDate: Date (required),
  numberOfDays: Number (required),
  reason: String (required),
  status: String (enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending'),
  managerComments: String,
  appliedDate: Date (default: Date.now),
  timestamps: true
}
```

## 🔐 Authentication

The API uses JWT (JSON Web Token) for authentication:
1. User logs in with email and password
2. Server validates credentials and generates a JWT token
3. Client stores the token
4. Client sends token in Authorization header for protected routes: `Authorization: Bearer <token>`
5. Server validates token before processing requests

## 🧪 Testing the API

You can test the API using tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example curl command:
```bash
# Register a user
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "john_doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "password": "password123",
    "role": "employee"
  }'

# Login
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## 📝 Notes

- Passwords are hashed using bcrypt before storing in the database
- JWT tokens expire after 1 hour
- All leave request endpoints require authentication
- The database name is "WorkBuddy"

## 🛠️ Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- cors: Enable CORS
- dotenv: Environment variables
- body-parser: Parse request bodies

## 👨‍💻 Development

For development with auto-reload:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

