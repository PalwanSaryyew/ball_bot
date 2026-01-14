import { Bot, Keyboard } from "grammy";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { getBalance } from "./fetchs";

dotenv.config();

// Load and parse the numbers data
const numbersPath = path.join(__dirname, "..", "data", "numbers.json");
const numbersData = JSON.parse(fs.readFileSync(numbersPath, "utf-8"));
const numberList = Object.keys(numbersData);

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is not defined in the environment variables.");
}

const bot = new Bot(token);

// Create a dynamic keyboard
const numberKeyboard = new Keyboard().resized();
numberList.forEach((num, index) => {
  numberKeyboard.text(num);
  // Add a new row after every 2 buttons
  if ((index + 1) % 2 === 0) {
    numberKeyboard.row();
  }
});


bot.command("start", (ctx) => {
    ctx.reply("Lütfen bakiye sorgulamak için bir numara seçin:", {
        reply_markup: numberKeyboard,
    });
});

// Handler for when a user clicks a number button
bot.on("message:text", async (ctx) => {
    const selectedNumber = ctx.message.text;

    // Check if the received message is one of the numbers from our list
    if (numberList.includes(selectedNumber)) {
        await ctx.reply(`'${selectedNumber}' için bakiye sorgulanıyor...`);
        const balance = await getBalance(selectedNumber);
        await ctx.reply(balance);
    } else {
        // Echo other messages that are not commands
        if (!selectedNumber.startsWith('/')) {
            ctx.reply(`You said: ${selectedNumber}`);
        }
    }
});


bot.start();

console.log("Bot is running...");
