# Shop-Sphere Auth Hub

### Description

The **Shop-Sphere Auth Hub** is a Node.js-based authentication backend built to handle multi-shop user authentication and session management. It provides user registration, login, secure token handling, and shop association features. Built using **Express.js**, **TypeScript**, and **MongoDB**, it's ideal for scalable SaaS platforms managing shop-specific user access.

---

### Prerequisites

Make sure the following are installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)
- [MongoDB](https://www.mongodb.com/) (local or remote instance)

---

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sabbirsami/shop-sphere-auth-hub
   ```

2. **Navigate into the project directory:**

   ```bash
   cd shop-sphere-auth-hub
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

---

### Configuration

Create a `.env` file in the root of the project and add the following:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/your-db-name
BCRYPT_SALT_ROUNDS=10
DEFAULT_PASSWORD=your_default_password

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

### Scripts

- `npm run build` — Compile TypeScript to JavaScript
- `npm start` — Start the built server
- `npm run start:dev` — Start server in development using nodemon
- `npm run lint` — Lint the code using ESLint
- `npm run format` — Format code using Prettier
- `npm run type-check` — Run TypeScript type checker

---

### Usage

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Start the development server:**

   ```bash
   npm run start:dev
   ```

3. Visit the API: `http://localhost:5000`

---

### Features

- Multi-shop user registration
- JWT-based access and refresh tokens
- Secure cookies and session handling
- Shop-specific user profiles
- Remember Me support with refresh tokens

---

### Models

#### User Model

- `username`: string
- `password`: hashed string
- `shops`: array of shop names (min. 3 required)
- `createdAt`: Date
- `updatedAt`: Date

---

### API Endpoints

#### Auth Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/profile` - Get the profile of the logged-in user
- `GET /api/auth/shop/:shopName` - Retrieve shop information
- `POST /api/auth/refresh-token` - Issue a new access token
- `POST /api/auth/logout` - Log out the user

---

### Postman Setup

**Base URL**: `http://localhost:5000`

#### Example Requests

**Register a User**

```json
POST /api/auth/register
{
  "username": "alice_wonder",
  "password": "alice123@",
  "shops": ["bookstore", "coffeehouse", "artgallery"]
}
```

**Login**

```json
POST /api/auth/login
{
  "username": "alice_wonder",
  "password": "alice123@",
  "rememberMe": true
}
```

**Profile Access**

```http
GET /api/auth/profile
Authorization: Bearer <accessToken>
```

**Shop Info**

```http
GET /api/auth/shop/bookstore
Authorization: Bearer <accessToken>
```

**Refresh Token**

```http
POST /api/auth/refresh-token
```

**Logout**

```http
POST /api/auth/logout
```

---

### Postman Test Scripts

**Login — Save Token**

```javascript
pm.test('Login successful', function () {
  pm.response.to.have.status(200);
  var jsonData = pm.response.json();
  if (jsonData.success) {
    pm.environment.set('accessToken', jsonData.data.accessToken);
  }
});
```

**Registration — Validate Response**

```javascript
pm.test('Registration successful', function () {
  pm.response.to.have.status(201);
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;
  pm.expect(jsonData.data.shops.length).to.be.at.least(3);
});
```

---

### Standard Response Format

```json
{
  "success": true,
  "message": "User created successfully",
  "statusCode": 201,
  "data": {
    "_id": "676abc123def456789012345",
    "username": "alice_wonder",
    "shops": ["bookstore", "coffeehouse", "artgallery"]
  }
}
```

---

### Development Practices

- Type-safe TypeScript architecture
- Centralized error handling
- JWT + Secure cookie-based sessions
- ESLint + Prettier for clean code
- Zod input validation (optional)

---

### Deployment

```bash
npm run build
npm start
```

Deploy using platforms like Render, Railway, or your own VPS.

---

### License

MIT License — [shop-sphere-auth-hub](https://github.com/sabbirsami/shop-sphere-auth-hub)
