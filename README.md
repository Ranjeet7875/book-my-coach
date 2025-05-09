# Book My Coach - Seat Booking Application

A full-stack seat booking application for coach/bus travel. This application allows users to sign up, login, view available seats, book seats, get optimal seat suggestions, and manage their bookings.

## Live Demo

- **Frontend**: [https://myseatbook11.netlify.app/](https://myseatbook11.netlify.app/)
- **Backend API**: [https://railwayseat.onrender.com](https://railwayseat.onrender.com)

## Features

- User authentication (signup/login)
- JWT-based authorization
- View all seats with availability status 
- Book up to 7 seats at once
- Smart seat suggestion algorithm based on seat count
- Cancel user bookings
- Reset all bookings (admin feature)

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (React.js assumed)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcrypt
- **Deployment**: 
  - Backend: Render
  - Frontend: Netlify

## Installation and Setup

### Prerequisites

- Node.js (v12 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Backend Setup

1. **Clone the repository**
   ```
   git clone https://github.com/Ranjeet7875/book-my-coach.git
   cd book-my-coach
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Create a .env file in the root directory with the following variables**
   ```
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/book-my-coach
   JWT_SECRET=your-secret-key
   ```

4. **Start the server**
   ```
   npm run start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

5. **The server will start running at**: `http://localhost:4000`

### Frontend Setup

To run the frontend locally:

1. Navigate to the frontend directory (if using a monorepo structure)
   ```
   cd frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Access the application at `http://localhost:3000`

## Project Structure

```
book-my-coach/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── seat.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── seat.route.js
│   │   └── user.route.js
│   ├── .env
│   ├── .gitignore
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md
```

## API Documentation

### Base URL

- Local: `http://localhost:4000`
- Production: `https://railwayseat.onrender.com`

### Authentication Endpoints

#### User Registration
- **URL**: `/register/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `201 Created`
  ```json
  {
    "Message": "User SuccessFull Signup",
    "NewUser": {
      "name": "User Name",
      "email": "user@example.com",
      "_id": "user_id",
      "createdAt": "timestamp"
    }
  }
  ```
- **Error Response**: `404 Not Found`
  ```
  User already exists with this email
  ```

#### User Login
- **URL**: `/register/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "Message": "User login Successfull",
    "token": "jwt_token_here"
  }
  ```
- **Error Response**: `404 Not Found`
  ```
  Invalid credentials
  ```
  or
  ```
  Failed to login
  ```

### Seat Management Endpoints

#### Get All Seats
- **URL**: `/seats`
- **Method**: `GET`
- **Auth Required**: Yes (JWT token in header)
- **Headers**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Success Response**: `200 OK`
  ```json
  [
    {
      "_id": "seat_id",
      "seatNumber": 1,
      "booked": false,
      "bookedBy": null
    },
    ...
  ]
  ```
- **Error Response**: `500 Internal Server Error`
  ```json
  {
    "message": "Failed to fetch seats"
  }
  ```

#### Book Seats
- **URL**: `/seats/book`
- **Method**: `POST`
- **Auth Required**: Yes (JWT token in header)
- **Headers**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Request Body**:
  ```json
  {
    "seatIds": ["seat_id_1", "seat_id_2", ...]
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Seats booked successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`:
    ```json
    { "message": "No seats selected" }
    ```
    or
    ```json
    { "message": "You can only book up to 7 seats at a time" }
    ```
    or
    ```json
    { "message": "Seat X is already booked" }
    ```
  - `404 Not Found`:
    ```json
    { "message": "Some selected seats do not exist" }
    ```
  - `500 Internal Server Error`:
    ```json
    { "message": "Failed to book seats" }
    ```

#### Suggest Seats
- **URL**: `/seats/suggest?count=n`
- **Method**: `GET`
- **Auth Required**: Yes (JWT token in header)
- **Headers**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Query Parameters**: `count` (number between 1-7, default: 1)
- **Success Response**: `200 OK`
  ```json
  [
    {
      "_id": "seat_id",
      "seatNumber": 1,
      "booked": false,
      "bookedBy": null
    },
    ...
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`:
    ```json
    { "message": "Please provide a valid count between 1 and 7" }
    ```
    or
    ```json
    { "message": "Not enough seats available" }
    ```
  - `500 Internal Server Error`:
    ```json
    { "message": "Failed to suggest seats" }
    ```

#### Cancel User's Bookings
- **URL**: `/seats/cancel`
- **Method**: `POST`
- **Auth Required**: Yes (JWT token in header)
- **Headers**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Your bookings have been canceled"
  }
  ```
  or
  ```json
  {
    "message": "You don't have any bookings to cancel"
  }
  ```
- **Error Response**: `500 Internal Server Error`
  ```json
  {
    "message": "Failed to cancel bookings"
  }
  ```

#### Reset All Bookings (Admin Feature)
- **URL**: `/seats/reset`
- **Method**: `POST`
- **Auth Required**: Yes (JWT token in header)
- **Headers**:
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "All bookings have been reset"
  }
  ```
- **Error Response**: `500 Internal Server Error`
  ```json
  {
    "message": "Failed to reset bookings"
  }
  ```

## Usage Instructions

1. **Registration/Login**:
   - Create a new account or login with existing credentials
   - A JWT token will be provided upon successful login

2. **View Seats**:
   - After login, you can view all available seats in the coach
   - Booked seats will be clearly marked

3. **Book Seats**:
   - Select up to 7 seats at once
   - Confirm your booking

4. **Get Seat Suggestions**:
   - Use the suggest feature to get optimal seat arrangements
   - Specify the number of seats (1-7) you need

5. **Cancel Bookings**:
   - Cancel all your current bookings if needed

## Seat Algorithm

The seat suggestion algorithm prioritizes:
1. Finding consecutive seats in the same row
2. If consecutive seats aren't available, finding seats in the row with most available seats
3. If no single row has enough seats, collecting seats from multiple rows starting with rows that have the most available seats

## Security

- Passwords are hashed using bcrypt
- Authentication is handled via JWT tokens
- Protected routes use auth middleware

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Developer Contact

For any questions or suggestions, please contact:
- GitHub: [Ranjeet7875](https://github.com/Ranjeet7875)
