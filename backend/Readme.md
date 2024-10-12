# Yoga Class Management API Backend
=====================================
This project provides a backend API for managing a Yoga class platform. It allows users to register, book classes, manage cart items, make payments via Stripe, and track enrollments. Admins and instructors have additional privileges to manage users and classes.

## Technologies Used
. Node.js: JavaScript runtime environment.
. Express: Web framework for Node.js.
. MongoDB: NoSQL database for data storage.
. Stripe: Payment processing platform.
. JWT: JSON Web Tokens for secure authentication.
. dotenv: Manages environment variables.

## Prerequisites
Ensure the following are installed or available:
1. Node.js installed (>= v12.x).
2. MongoDB instance (local or cloud-based such as MongoDB Atlas).
3. Stripe account for payment processing.

## Environment Variables
Create a .env file with the following keys:
`
PORT=your_port
DB_USER=your_db_user
DB_PASSWORD=your_db_password
PAYMENT_SECRET=your_stripe_secret_key
ASSESS_SECRET=your_jwt_secret
`

## Project Setup
### Clone the repository:
`
git clone https://github.com/yourusername/yoga-api.git
cd yoga-api
`

### Install dependencies:
`
npm install
`

### Start the development server:
`
npm start
`
This will start the server on the port specified in the .env file or port 3000 by default.

## API Endpoints
### Authentication & Authorization
. POST /api/set-token: Generate a JWT token for a user.
.. Request Body: { email: 'user@example.com', role: 'user' }
.. Response: { token: 'your_jwt_token' }
Users Management
.. POST /new-user: Add a new user to the system.

.. Request Body: { name: 'User Name', email: 'user@example.com', role: 'student' }
.. GET /users: Retrieve all users.

.. GET /users/:id: Get details of a user by their ID.

.. PUT /update-user/:id: Update user details.

.. Requires: JWT token and Admin privileges.
.. DELETE /delete-user/:id: Delete a user by ID.
https://chatgpt.com/c/670ab55e-4ab0-8000-af8a-6deb0121b782
Requires: JWT token and Admin privileges.
Classes Management
POST /new-class: Add a new class.

Requires: JWT token and Instructor privileges.
GET /classes: Retrieve all classes.

GET /classes/:email: Get classes created by a specific instructor.

PATCH /change-status/:id: Approve, reject, or update class status.

Requires: JWT token and Admin privileges.
PUT /update-class/:id: Update class details.

Requires: JWT token and Instructor privileges.
Cart Management
POST /add-to-cart: Add a class to the cart.

Requires: JWT token.
GET /cart/:email: Retrieve cart items by user email.

Requires: JWT token.
DELETE /delete-cart-item/:id: Remove a class from the cart.

Requires: JWT token.
Payments
POST /create-payment-intent: Create a Stripe Payment Intent.

Request Body: { price: '100' }
Response: Stripe client_secret for payment.
POST /payment-info: Save payment details after successful payment.

Requires: JWT token.
GET /payment-history/:email: Retrieve payment history for a user.

Enrollment Management
GET /popular_classes: Get top 6 classes based on enrollment.

GET /enrolled-classes/:email: Get all classes a user has enrolled in.

Requires: JWT token.
Instructor Applications
POST /ass-instructor: Apply to become an instructor.

Request Body: { name: 'John Doe', email: 'johndoe@example.com' }
GET /applied-instructors/:email: Check if a user has applied for instructor status.

Admin Management
GET /admin-stats: Retrieve general statistics for admins.
Requires: JWT token and Admin privileges.
Miscellaneous
GET /: Basic route for server health check.
Authentication
This API uses JWT (JSON Web Tokens) for user authentication. The token must be included in the Authorization header of protected routes:

plaintext
Copy code
Authorization: Bearer your_jwt_token
Error Handling
401 Unauthorized: This error occurs when an invalid token is provided, or when a user attempts to access a protected route without the necessary privileges.
403 Forbidden: This error occurs when a user does not have permission to access a specific resource.
License
This project is licensed under the MIT License.