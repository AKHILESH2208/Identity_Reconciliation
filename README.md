# Bitespeed Identity Reconciliation Service

A backend service for identifying and tracking customer identity across multiple purchases using different contact information.

## 🚀 Live Demo

**API Endpoint:** `https://your-app.onrender.com/identify` (Update after deployment)

## 📋 Features

- **Identity Reconciliation**: Links customer contacts based on shared email or phone number
- **Primary/Secondary Contact Management**: Automatically manages contact hierarchy
- **Smart Linking**: Converts primary contacts to secondary when discovering connections
- **Test Endpoints**: Easy-to-use endpoints for testing and debugging

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Hosting**: Render.com (recommended)

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd BiteSpeed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed_db?schema=public"
   PORT=3000
   ```

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## 🔌 API Endpoints

### 1. Main Identity Endpoint

**POST** `/identify`

Identifies and reconciles customer contact information.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'
```

### 2. Test Endpoints

#### Add Contact (for testing)

**POST** `/add-contact`

Adds a new primary contact to the database for testing purposes.

**Request Body:**
```json
{
  "email": "test@example.com",
  "phoneNumber": "1234567890"
}
```

#### Get All Contacts

**GET** `/contacts`

Retrieves all contacts from the database.

#### Delete All Contacts

**DELETE** `/contacts`

Removes all contacts from the database (useful for testing).

## 🧪 Testing Scenarios

### Scenario 1: New Customer
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

Creates a new primary contact.

### Scenario 2: Existing Customer with New Info
```bash
# First request
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'

# Second request with new email, same phone
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'
```

Creates a secondary contact linked to the primary.

### Scenario 3: Linking Two Primary Contacts
```bash
# Create first primary
curl -X POST http://localhost:3000/add-contact \
  -H "Content-Type: application/json" \
  -d '{"email":"george@hillvalley.edu","phoneNumber":"919191"}'

# Create second primary
curl -X POST http://localhost:3000/add-contact \
  -H "Content-Type: application/json" \
  -d '{"email":"biffsucks@hillvalley.edu","phoneNumber":"717171"}'

# Link them together
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"george@hillvalley.edu","phoneNumber":"717171"}'
```

The newer primary contact becomes secondary.

## 🚢 Deployment

### Deploying to Render.com

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect your GitHub repository**

3. **Configure the service:**
   - **Environment**: Node
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run prisma:deploy && npm start`
   - **Add Environment Variable**: 
     - Key: `DATABASE_URL`
     - Value: Your PostgreSQL connection string

4. **Create a PostgreSQL database** on Render and link it to your web service

5. **Deploy!** Render will automatically deploy your application

### Alternative: Deploying to Railway/Heroku

Similar steps apply - connect your repo, set environment variables, and deploy.

## 📊 Database Schema

```prisma
model Contact {
  id              Int       @id @default(autoincrement())
  phoneNumber     String?
  email           String?
  linkedId        Int?
  linkPrecedence  String    // "primary" or "secondary"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
}
```

## 🏗️ Project Structure

```
BiteSpeed/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── routes/
│   │   ├── identify.ts        # /identify endpoint
│   │   └── test.ts            # Test endpoints
│   ├── services/
│   │   └── identityService.ts # Core business logic
│   ├── db.ts                  # Prisma client
│   └── index.ts               # Express app setup
├── .env                       # Environment variables
├── .env.example              # Environment template
├── package.json
└── tsconfig.json
```

## 🧩 How It Works

1. **Initial Request**: When a contact is identified, the service searches for existing contacts with matching email or phone number

2. **No Match**: Creates a new primary contact

3. **Single Match**: If new information is provided, creates a secondary contact linked to the primary

4. **Multiple Primaries**: If two separate primary contacts are discovered to be the same person, the older one remains primary and the newer becomes secondary

5. **Response**: Returns consolidated contact information with all associated emails, phone numbers, and secondary contact IDs

## 🤝 Contributing

This is a task submission project. For the complete requirements, see the included PDF.

## 📝 License

MIT

## 📧 Contact

For questions or issues, please open an issue on GitHub.
