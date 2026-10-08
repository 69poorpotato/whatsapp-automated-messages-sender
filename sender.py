import datetime
import os
import sys
import time
import requests
import schedule

SERVER_URL = os.getenv("SERVER_URL", "http://localhost:3000/send")
CHAT_ID = os.getenv("CHAT_ID", "")
MESSAGE = os.getenv("MESSAGE", "")
INTERVAL_MINUTES = int(os.getenv("INTERVAL_MINUTES", "3"))
REQUEST_TIMEOUT = 15

def get_timestamp():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log(msg):
    print(f"[{get_timestamp()}] {msg}", flush=True)

def send_message():
    if not CHAT_ID or not MESSAGE:
        log("CHAT_ID or MESSAGE not set.")
        return

    payload = {
        "chatId": CHAT_ID,
        "message": MESSAGE
    }

    log(f"Sending message to {CHAT_ID}")

    try:
        response = requests.post(
            SERVER_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT
        )

        if response.status_code == 200:
            data = response.json()
            msg_id = data.get("messageId", "unknown")
            log(f"Success: Message delivered (ID: {msg_id})")
        elif response.status_code == 503:
            log("Warning: Server is running but WhatsApp client is not ready yet.")
        elif response.status_code == 400:
            log(f"Bad Request: {response.text}")
        else:
            log(f"Error ({response.status_code}): {response.text}")

    except requests.exceptions.ConnectionError:
        log(f"Connection Error: Could not connect to {SERVER_URL}")
    except requests.exceptions.Timeout:
        log(f"Timeout Error: Request timed out after {REQUEST_TIMEOUT}s")
    except requests.exceptions.RequestException as exc:
        log(f"Request Exception: {exc}")
    except Exception as exc:
        log(f"Unexpected Error: {exc}")

def main():
    if not CHAT_ID or not MESSAGE:
        print("Set CHAT_ID and MESSAGE environment variables before running.")
        sys.exit(1)

    log(f"Starting message sender service for {CHAT_ID} every {INTERVAL_MINUTES} minutes.")
    send_message()
    schedule.every(INTERVAL_MINUTES).minutes.do(send_message)

    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        log("Process terminated.")
        sys.exit(0)

if __name__ == "__main__":
    main()
