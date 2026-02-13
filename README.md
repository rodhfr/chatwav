# ChatWave -- Real-Time Chat Application

A real-time messaging app with chat rooms, online presence, and typing indicators.
Built with Socket.io, React, Express, TypeScript, and PostgreSQL.

## Tech Stack

| Layer     | Technology                             |
|-----------|----------------------------------------|
| Frontend  | React 18, TypeScript, Vite             |
| Styling   | Tailwind CSS                           |
| Backend   | Node.js, Express, TypeScript           |
| WebSocket | Socket.io                              |
| Database  | PostgreSQL 16                          |
| ORM       | Prisma                                 |
| Auth      | JWT (jsonwebtoken + bcrypt)            |
| Infra     | Docker Compose (database)              |

## Features

- User authentication (register, login, logout)
- Create and join chat rooms
- Real-time messaging via WebSockets
- Message persistence in PostgreSQL
- Online presence indicators (who's in each room)
- Typing indicators ("user is typing...")
- Message history with pagination (scroll to load older messages)
- Sidebar with room list

## Architecture

```
chatwav/
|
|-- server/                     Express + Socket.io API
|   |-- src/
|   |   |-- index.ts            Entry point (HTTP + WS)
|   |   |-- socket.ts           Socket.io event handlers
|   |   |-- routes/             REST endpoints
|   |   |-- controllers/        Request handlers
|   |   |-- middleware/          JWT auth guard
|   |   |-- lib/                Prisma client singleton
|   |   +-- types/              Shared TypeScript types
|   +-- prisma/
|       +-- schema.prisma       Database schema
|
|-- client/                     React SPA
|   |-- src/
|   |   |-- main.tsx            Entry point
|   |   |-- App.tsx             Router setup
|   |   |-- socket.ts           Socket.io client instance
|   |   |-- api/                Axios HTTP client
|   |   |-- hooks/              useAuth, useSocket, useChat
|   |   |-- pages/              Home, Chat, SignIn, SignUp
|   |   |-- components/         MessageList, MessageInput,
|   |   |                       RoomList, Sidebar, OnlineUsers,
|   |   |                       CreateRoomModal, Navbar
|   |   |-- context/            Auth context provider
|   |   +-- types/              TypeScript interfaces
|   +-- index.html
|
|-- docker-compose.yml          PostgreSQL container
+-- .env.example                Environment variable template
```

### Data Model

```
User --(1:N)-- Message --(N:1)-- Room
  |                                |
  +-----(N:M via RoomMember)------+
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker and Docker Compose
- npm

### 1. Clone and configure

```bash
git clone https://github.com/rodhfr/chatwav.git
cd chatwav
cp .env.example .env
```

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Set up the server

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API will be available at `http://localhost:3001`.

### 4. Set up the client

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

All REST endpoints are prefixed with `/api`.

### Authentication

| Method | Path               | Body                          | Auth | Description    |
|--------|--------------------|-------------------------------|------|----------------|
| POST   | /api/auth/register | username, email, password     | No   | Create account |
| POST   | /api/auth/login    | email, password               | No   | Get JWT token  |

### Rooms

| Method | Path                    | Auth | Description              |
|--------|-------------------------|------|--------------------------|
| GET    | /api/rooms              | Yes  | List all rooms           |
| POST   | /api/rooms              | Yes  | Create room              |
| POST   | /api/rooms/:id/join     | Yes  | Join a room              |
| POST   | /api/rooms/:id/leave    | Yes  | Leave a room             |
| GET    | /api/rooms/:id/members  | Yes  | List room members        |

### Messages

| Method | Path                         | Query Params | Auth | Description              |
|--------|------------------------------|-------------|------|--------------------------|
| GET    | /api/rooms/:id/messages      | cursor, limit | Yes  | Message history (cursor-based) |

## WebSocket Events

### Client to Server

| Event         | Payload                    | Description                   |
|---------------|----------------------------|-------------------------------|
| join-room     | { roomId }                 | Join a room's live channel    |
| leave-room    | { roomId }                 | Leave a room's live channel   |
| send-message  | { roomId, content }        | Send a message to a room      |
| typing        | { roomId }                 | Notify room that user is typing |
| stop-typing   | { roomId }                 | Notify room that user stopped typing |

### Server to Client

| Event         | Payload                                    | Description                        |
|---------------|--------------------------------------------|------------------------------------|
| new-message   | { id, content, createdAt, roomId, user }   | New message in a room              |
| room-users    | { roomId, users[] }                        | Updated list of online users       |
| user-typing   | { userId, username, roomId }               | Someone is typing                  |
| stop-typing   | { userId, roomId }                         | Someone stopped typing             |
| user-online   | { userId, username }                       | A user connected                   |
| user-offline  | { userId, username }                       | A user disconnected                |
| error         | { message }                                | Error notification                 |

## Environment Variables

| Variable         | Description              | Default                                                          |
|------------------|--------------------------|------------------------------------------------------------------|
| DATABASE_URL     | PostgreSQL connection    | postgresql://chatwav:chatwav@localhost:5432/chatwav?schema=public |
| JWT_SECRET       | Secret for signing JWTs  | (required)                                                       |
| PORT             | Server port              | 3001                                                             |
| CLIENT_URL       | Frontend URL for CORS    | http://localhost:5173                                            |
| VITE_API_URL     | API base URL for client  | http://localhost:3001/api                                        |
| VITE_WS_URL      | WebSocket URL for client | http://localhost:3001                                            |

## License

MIT
