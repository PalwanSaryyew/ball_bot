import { Bot, Keyboard } from "grammy";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { getBalance } from "./fetchs";

dotenv.config();

// Load and parse the numbers data
const numbersPath = path.join(__dirname, "..", "data", "numbers.json");

// numbersData artık doğrudan bir dizi: [ {number: "...", pass: "...", token: "..." }, ... ]
const numbersData: any[] = JSON.parse(fs.readFileSync(numbersPath, "utf-8"));

// Sadece 'number' değerlerini bir diziye çıkartıyoruz
const validNumbers = numbersData.map((item) => item.number);

const token = process.env.BOT_TOKEN;
const allowedUserIdsString = process.env.ALLOWED_USER_IDS;

if (!token) {
   throw new Error("BOT_TOKEN is not defined in the environment variables.");
}
if (!allowedUserIdsString) {
   throw new Error(
      "ALLOWED_USER_IDS is not defined in the environment variables.",
   );
}

const allowedUserIds = allowedUserIdsString
   .split(",")
   .map((id) => parseInt(id.trim(), 10));

const bot = new Bot(token);

// --- Authorization Middleware ---
bot.use(async (ctx, next) => {
   if (ctx.from && allowedUserIds.includes(ctx.from.id)) {
      // User is allowed, proceed to the next middleware/handler
      await next();
   } else {
      // User is not allowed, send a message and stop processing
      await ctx.reply("You do not have permission to use this bot..");
      console.log(`Unauthorized access attempt by user ID: ${ctx.from?.id}`);
   }
});

// Create a dynamic keyboard
// Create a dynamic keyboard
const numberKeyboard = new Keyboard().resized();

validNumbers.forEach((num, index) => {
   // Önce düğmeyi ekliyoruz
   numberKeyboard.text(num); 

   // Eğer numara belirlediğimiz numaralardan biriyse rengini değiştiriyoruz
   if (num === "62545254") {
      numberKeyboard.style("danger");  // Düğmeyi kırmızı yapar
   } else if (num === "63483220") {
      numberKeyboard.style("success"); // Düğmeyi yeşil yapar
   }
   // Diğer numaralar için hiçbir şey yapmıyoruz, Telegram'ın standart renginde (şeffaf/gri) kalıyorlar.

   // Add a new row after every 2 buttons
   if ((index + 1) % 2 === 0) {
      numberKeyboard.row();
   }
});

bot.command("start", (ctx) => {
   ctx.reply("Please select the number to check the balance:", {
      reply_markup: numberKeyboard,
   });
});

// Handler for when a user clicks a number button
bot.on("message:text", async (ctx) => {
   const selectedNumber = ctx.message.text;

   // Mesajın geçerli numaralardan biri olup olmadığını kontrol et
   if (validNumbers.includes(selectedNumber)) {
      // bot.ts içindeki ilgili kısım:

      await ctx.reply(`Checking the balance for ${selectedNumber}...`);

      // SADECE NUMARAYI GÖNDERİYORUZ
      const balance = await getBalance(selectedNumber);

      await ctx.reply(balance);
   } else {
      // Sadece komut olmayan mesajlara yanıt ver
      if (!selectedNumber.startsWith("/")) {
         ctx.reply(`You said: ${selectedNumber}`);
      }
   }
});

bot.start();

console.log("Bot is running...");
