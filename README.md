# TMCELL Balance Check Bot

This is a Telegram bot built with TypeScript and `grammy` that allows you to check the account balance for TMCELL phone numbers by scraping the official website.

## Features

-   Fetches balance for predefined phone numbers.
-   Uses a Telegram keyboard for easy number selection.
-   Automatically handles session tokens and re-login when a session expires.
-   Restricts access to a list of allowed Telegram user IDs.

## Project Structure

```
tmcell/
├── data/
│   └── numbers.json.sample   # Sample for numbers and credentials
├── src/
│   ├── bot.ts                # Main bot logic and Telegram interaction
│   └── fetchs.ts             # Handles scraping and fetching data from the website
├── .env.sample               # Sample for environment variables
├── package.json
└── tsconfig.json
```

## Setup

1.  **Clone the repository.**

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    -   Rename or copy `.env.sample` to `.env`.
    -   Open the `.env` file and add your Telegram bot token and the allowed user IDs. You can get a token by talking to the [BotFather](https://t.me/botfather).
    ```env
    BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
    ALLOWED_USER_IDS=USER_ID_1,USER_ID_2
    ```

4.  **Create `numbers.json`:**
    -   In the `data/` directory, rename or copy `numbers.json.sample` to `numbers.json`.
    -   Edit `numbers.json` to add the phone numbers you want to check. The phone number is the key, and the `pass` is the password for the `my.tmcell.tm` account. The `token` can be left empty, as the bot will fetch it automatically on the first run.
    ```json
    {
      "6XXXXXXX": {
        "token": "",
        "pass": "YOUR_PASSWORD"
      },
      "6YYYYYYY": {
        "token": "",
        "pass": "ANOTHER_PASSWORD"
      }
    }
    ```

## Running the Bot

### Development Mode

To run the bot in development mode with automatic reloading:

```bash
npm run dev
```

### Production Mode

1.  **Build the project:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code into JavaScript in the `dist/` directory.

2.  **Start the bot:**
    ```bash
    npm start
    ```

The bot should now be running. Send the `/start` command to it on Telegram to see the list of numbers and check their balances.
