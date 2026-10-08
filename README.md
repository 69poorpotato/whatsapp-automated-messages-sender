# whatsapp-automated-messages-sender

Lightweight WhatsApp messaging service with an HTTP REST API and background scheduler. Built on top of whatsapp-web.js and Express, with support for local execution or containerized deployment in Docker.

## Requirements

- Node.js 18+ (for local Node server)
- Python 3.9+ (optional, for Python scheduler)
- Docker and Docker Compose (optional, for containerized deployment)

## Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. (Optional) Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables (optional, copy from `.env.example`):
```bash
cp .env.example .env
```

## Usage

### Local Server

Start the REST bridge:
```bash
npm start
```

On first startup, scan the terminal QR code using WhatsApp (Linked Devices). Session tokens persist in the `./session` directory across restarts.

### API Endpoints

- `POST /send`: Send a message
```json
{
  "chatId": "1234567890@c.us",
  "message": "Hello world"
}
```

- `GET /health`: Service health and client readiness check

### Python Scheduler

Run the automated sender script:
```bash
python sender.py
```

Set `CHAT_ID` and `MESSAGE` environment variables or pass them before executing.

### Docker Deployment

Run with Docker Compose:
```bash
docker compose up -d --build
```

Stop container:
```bash
docker compose down
```

## License

MIT
