# xs-chat-backend

xs-chat-backend is a backend service for xs-chat, providing user authentication, message processing, and real-time communication.

> Frontend: https://github.com/FishCharlotte/xs-chat-frontend

## Technology Stack

- Koa.js
- Socket.io
- SQLite3
- Redis
- RabbitMQ
- Sequelize

## Installation

Please make sure you have installed [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/).

```bash
git clone https://github.com/FishCharlotte/xs-chat-backend.git
cd xs-chat-backend
npm install
```

## Usage

Start the development server locally:

```bash
npm run dev
```

Build the production version:

```bash
node app.js
```

Build the image (Docker Compose):

```bash
docker-compose build
```

Start the server (Docker Compose):

```bash
docker-compose up -d
```

## License

MIT License
