# Murkylook API

A GraphQL API for managing travel destinations and visit tracking.

## 🚀 Features

- Destination management
- Geographic hierarchy (Continents → Countries → Destinations)
- Visit tracking
- Statistical analysis
- User management

## 🛠️ Tech Stack

- Node.js
- TypeScript
- Express
- Apollo Server (GraphQL)
- PostgreSQL
- Docker (optional)

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/murkylook-api.git
cd murkylook-api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=4000
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=murkylook
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

4. Start the server:
```bash
npm run dev
```

## 📝 API Documentation

Access GraphQL Playground at `http://localhost:4000/graphql`

### Example Queries

```graphql
# Get all destinations
query {
  destinations {
    items {
      id
      name
      country {
        name
      }
    }
    totalCount
  }
}

# Record a visit
mutation {
  createVisit(input: {
    destinationId: "123"
    visitedAt: "2024-01-01T12:00:00Z"
  }) {
    id
    visited_at
  }
}
```

## 🧪 Testing

```bash
npm test
```

## 📦 Deployment

[Add deployment instructions here]

## 👥 Contributing

[Add contribution guidelines here]

## 📄 License

[Add license information here] 