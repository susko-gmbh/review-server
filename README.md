# Review Sync Backend

### Description

The **Review Sync Backend** is a Node.js-based backend service built to handle review data synchronization and management. It provides webhook endpoints for receiving review data, manages business profiles, reviews, and reviewer replies. Built using **Express.js**, **TypeScript**, and **MongoDB**, it's designed for scalable review management systems that need to sync data from external platforms.

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
   git clone https://github.com/sabbirsami/review-sync-backend
   ```

2. **Navigate into the project directory:**

   ```bash
   cd review-sync-backend
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

- Webhook endpoints for review data synchronization
- Business profile management
- Review and reviewer reply management
- RESTful API for data retrieval
- MongoDB integration with Mongoose
- TypeScript support with comprehensive validation

---

### Models

#### Business Profile Model

- `businessProfileId`: string (unique identifier)
- `businessProfileName`: string
- `createdAt`: Date
- `updatedAt`: Date

#### Review Model

- `reviewId`: string (unique identifier)
- `businessProfileId`: string
- `reviewerName`: string
- `starRating`: number
- `comment`: string
- `createTime`: Date
- `updateTime`: Date

#### Reviewer Reply Model

- `reviewId`: string
- `businessProfileId`: string
- `comment`: string
- `createTime`: Date
- `updateTime`: Date

---

### API Endpoints

#### Webhook Routes

- `POST /api/webhook/reviews` - Receive review data from external platforms
- `GET /api/webhook/status` - Get webhook service status

#### Business Profile Routes

- `GET /api/business-profiles` - Get all business profiles
- `GET /api/business-profiles/:id` - Get a specific business profile

#### Review Routes

- `GET /api/reviews` - Get reviews with filtering and pagination
- `GET /api/reviews/:id` - Get a specific review

#### Reviewer Reply Routes

- `GET /api/reviewer-replies` - Get reviewer replies with filtering and pagination
- `GET /api/reviewer-replies/:reviewId` - Get replies for a specific review
- `DELETE /api/reviewer-replies/:reviewId` - Delete a reviewer reply

---

### Postman Setup

**Base URL**: `http://localhost:5000`

#### Example Requests

**Send Review Data via Webhook**

```json
POST /api/webhook/reviews
{
  "businessProfileId": "4190239679011070000",
  "businessProfileName": "Example Business",
  "executionTimestamp": "2024-01-15T10:30:00Z",
  "reviews": [
    {
      "reviewId": "review123",
      "reviewerName": "John Doe",
      "starRating": 5,
      "comment": "Great service!",
      "createTime": "2024-01-15T09:00:00Z"
    }
  ],
  "reviewReplies": [
    {
      "reviewId": "review123",
      "comment": "Thank you for your feedback!",
      "createTime": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Get Reviews**

```http
GET /api/reviews?businessProfileId=4190239679011070000&limit=10&page=1
```

**Get Reviewer Replies**

```http
GET /api/reviewer-replies?businessProfileId=4190239679011070000&limit=5
```

**Get Specific Review**

```http
GET /api/reviews/review123
```

---

### Postman Test Scripts

**Webhook — Validate Response**

```javascript
pm.test('Webhook data processed successfully', function () {
  pm.response.to.have.status(200);
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;
  pm.expect(jsonData.data.processedReviews).to.be.a('number');
});
```

**Reviews — Validate Pagination**

```javascript
pm.test('Reviews retrieved with pagination', function () {
  pm.response.to.have.status(200);
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.be.true;
  pm.expect(jsonData.data.reviews).to.be.an('array');
  pm.expect(jsonData.data.pagination).to.have.property('total');
});
```

---

### Standard Response Format

```json
{
  "success": true,
  "message": "Review data processed successfully",
  "statusCode": 200,
  "data": {
    "processedReviews": 5,
    "processedReviewerReplies": 3,
    "businessProfileId": "4190239679011070000"
  }
}
```

---

### Development Practices

- Type-safe TypeScript architecture
- Centralized error handling
- MongoDB with Mongoose ODM
- ESLint + Prettier for clean code
- Zod input validation for request data
- Modular architecture with separate services

---

### Deployment

```bash
npm run build
npm start
```

Deploy using platforms like Render, Railway, or your own VPS.

---

### License

MIT License — [review-sync-backend](https://github.com/sabbirsami/review-sync-backend)
