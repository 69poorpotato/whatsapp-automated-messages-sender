# whatsapp-automated-messages-sender-js

Production-ready, modular WhatsApp messaging service and automated dispatcher built with Node.js, Express, and whatsapp-web.js.

## Architecture

```
whatsapp-automated-messages-sender-js/
├── src/
│   ├── client/
│   │   └── whatsapp.js         # WhatsApp client lifecycle, QR auth, event handlers
│   ├── config/
│   │   └── index.js            # Environment configuration loader and defaults
│   ├── jobs/
│   │   └── scheduler.js        # Automated recurring message dispatcher
│   ├── routes/
│   │   └── index.js            # Express API route handlers
│   ├── services/
│   │   └── messageService.js   # Contact resolution, LID normalization, message delivery
│   └── app.js                  # Express application setup
├── index.js                    # Service entry point and graceful shutdown
├── docker-compose.yml          # Container orchestration definition
├── Dockerfile                  # Headless Chromium container build
├── package.json
└── README.md
```

## Requirements

- Node.js 18+
- npm 9+
- Docker and Docker Compose (optional, for containerized environments)

## Installation

```bash
git clone https://github.com/69poorpotato/whatsapp-automated-messages-sender-js.git
cd whatsapp-automated-messages-sender-js
npm install
```

## Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP server port | `3000` |
| `AUTO_TARGET` | Automated destination phone number or chat ID (e.g. `1234567890@c.us`) | Empty |
| `AUTO_MESSAGE` | Automated message payload | Empty |
| `AUTO_INTERVAL_MINUTES` | Frequency of automated message in minutes | `3` |
| `PUPPETEER_EXECUTABLE_PATH` | Path to system Chromium executable (used in container) | System default |

If `AUTO_TARGET` and `AUTO_MESSAGE` are set, the scheduler automatically sends the message immediately upon connection and repeats at the specified interval.

## Usage

### Local Environment

Start the service:

```bash
npm start
```

1. On first run, a QR code appears in the terminal.
2. Open WhatsApp on your device, navigate to **Linked Devices > Link a Device**, and scan the QR code.
3. Session tokens persist in the `./session` directory. Subsequent restarts authenticate automatically.

### Docker Deployment

Run containerized with headless Chromium:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f
```

Stop container:

```bash
docker compose down
```

## API Reference

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "online",
  "whatsappReady": true,
  "autoMessage": {
    "configured": true,
    "intervalMinutes": 3
  },
  "timestamp": "2026-10-08T20:00:00.000Z"
}
```

### Send Message

```http
POST /send
Content-Type: application/json

{
  "chatId": "1234567890@c.us",
  "message": "Hello from automated dispatcher"
}
```

Response:
```json
{
  "success": true,
  "chatId": "1234567890@c.us",
  "messageId": "true_1234567890@c.us_3EB0...",
  "timestamp": "2026-10-08T20:00:00.000Z"
}
```

## License

MIT
