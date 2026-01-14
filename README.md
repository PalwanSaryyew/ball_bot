# Telegram Echo Bot

This is a simple Telegram bot created with TypeScript and `grammy`. It echoes any text message it receives.

## Setup

1.  **Clone the repository (or use the code you have).**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    -   Rename the `.env.sample` file to `.env`.
    -   Open the `.env` file and add your Telegram bot token. You can get a token by talking to the [BotFather](https://t.me/botfather) on Telegram.
    ```
    BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
    ```

## Running the Bot

### Development Mode

To run the bot in development mode with automatic reloading, use:

```bash
npm run dev
```

### Production Mode

1.  **Build the project:**
    ```bash
    npm run build
    ```
    This will compile the TypeScript code into JavaScript in the `dist` directory.

2.  **Start the bot:**
    ```bash
    npm start
    ```

The bot should now be running and will respond to messages sent to it on Telegram.
