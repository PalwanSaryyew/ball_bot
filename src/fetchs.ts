import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import qs from "qs";

const numbersPath = path.join(__dirname, "..", "data", "numbers.json");

// Helper function to read numbers data from JSON file
function readNumbersData(): any {
   try {
      const data = fs.readFileSync(numbersPath, "utf-8");
      return JSON.parse(data);
   } catch (error) {
      console.error("Error reading numbers.json:", error);
      return {};
   }
}

// Helper function to write numbers data to JSON file
function writeNumbersData(data: any): void {
   try {
      fs.writeFileSync(numbersPath, JSON.stringify(data, null, 3));
   } catch (error) {
      console.error("Error writing to numbers.json:", error);
   }
}

export async function loginAndGetToken(
   login: string,
   password: string
): Promise<string | null> {
   const url = "https://my.tmcell.tm/";
   const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";

   try {
      const initialResponse = await axios.get(url, {
         headers: { "User-Agent": userAgent },
      });

      const $ = cheerio.load(initialResponse.data as string);
      const csrfToken = $('input[name="_csrf"]').val() as string;

      const setCookie = initialResponse.headers["set-cookie"];
      let phpSessionId = "";
      if (setCookie) {
         const match = setCookie[0].match(/PHPSESSID=([^;]+)/);
         if (match) phpSessionId = match[1];
      }

      if (!csrfToken || !phpSessionId) {
         console.error("No CSRF token or Session ID was found.");
         return null;
      }

      const loginData = qs.stringify({
         login: login,
         password: password,
         "login-remember-me": "on",
         _csrf: csrfToken,
      });

      const postHeaders = {
         "Content-Type": "application/x-www-form-urlencoded",
         Cookie: `PHPSESSID=${phpSessionId}`,
         "User-Agent": userAgent,
         Origin: "https://my.tmcell.tm",
         Referer: "https://my.tmcell.tm/",
      };

      await axios.post(url, loginData, {
         headers: postHeaders,
         maxRedirects: 0,
         validateStatus: (status) => status >= 200 && status < 400,
      });

      return phpSessionId;
   } catch (error) {
      console.error("Login failed:", error);
      return null;
   }
}

async function fetchBalanceWithToken(token: string): Promise<string | null> {
   const url = "https://my.tmcell.tm/";
   const headers = {
      "User-Agent":
         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      Accept:
         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      Cookie: `PHPSESSID=${token}`,
   };

   try {
      const response = await axios.get(url, { headers });
      const html = response.data as string;
      const $ = cheerio.load(html);

      let balance: string | null = null;
      $("div.fs-1.fw-bold").each((_index, element) => {
         const content = $(element).text().trim();
         if (content.toLowerCase().includes("manat")) {
            balance = content;
            return false;
         }
      });
      return balance; // Returns balance string or null
   } catch (error) {
      console.error("Balance fetch error:", error);
      return null; // Indicates an error occurred
   }
}

// (Dosyanın üst kısımlarındaki importlar ve diğer fonksiyonlar aynı kalacak)

// Bakiyenin içinden sadece sayıları almak için yardımcı fonksiyon (Örn: "15.40 manat" -> 15.40)
function parseBalance(balanceStr: string): number {
   const match = balanceStr.match(/[\d,\.]+/);
   if (match) {
      // Virgül varsa noktaya çevirip ondalıklı sayıya dönüştürüyoruz
      return parseFloat(match[0].replace(',', '.'));
   }
   return 0;
}

export async function getBalance(selectedNumber: string): Promise<string> {
   const numbersData = readNumbersData();
   const numberIndex = numbersData.findIndex((item: any) => item.number === selectedNumber);

   if (numberIndex === -1) {
      return `'No information was found or is missing for '${selectedNumber}'.`;
   }

   const numberInfo = numbersData[numberIndex];

   if (!numberInfo.token || !numberInfo.pass) {
      return `Missing pass or token for '${selectedNumber}'.`;
   }

   // JSON'dan token, pass ve varsa bir önceki bakiyeyi (lastBalance) alıyoruz
   let { token, pass, lastBalance } = numberInfo;

   // 1. Aşama: Mevcut token ile bakiyeyi çekmeyi dene
   let balance = await fetchBalanceWithToken(token);

   // Eğer bakiye çekilemediyse (token patlamışsa) yeni token al
   if (!balance) {
      console.log(`Token for ${selectedNumber} seems invalid. Attempting to get a new one.`);
      const newToken = await loginAndGetToken(selectedNumber, pass);

      if (!newToken) {
         return "New tokens could not be obtained. Login information may be incorrect.";
      }

      // Yeni token'ı JSON'a kaydet
      numbersData[numberIndex].token = newToken;
      writeNumbersData(numbersData);
      console.log(`New token for ${selectedNumber} saved.`);

      // Yeni token ile tekrar dene
      balance = await fetchBalanceWithToken(newToken);
   }

   // Bakiye başarıyla çekildiyse fark hesaplaması yap
   if (balance) {
      let diffMessage = "";

      // Eğer sistemde daha önceden kaydedilmiş bir bakiye varsa karşılaştır
      if (lastBalance) {
         const currentNum = parseBalance(balance);
         const lastNum = parseBalance(lastBalance);
         const diff = currentNum - lastNum;

         if (diff > 0) {
            diffMessage = `\n📈 Tapawut: +${diff.toFixed(2)} manat`;
         } else if (diff < 0) {
            diffMessage = `\n📉 Tapawut: ${diff.toFixed(2)} manat`; // diff zaten eksi değerde olacak
         } else {
            diffMessage = `\n➖ Tapawut: Üýtgeşme ýok`;
         }
      } else {
         diffMessage = `\n(Ilkinji barlag, öňki balans ýazgysy ýok)`;
      }

      // Bir sonraki sorgulama için şu anki bakiyeyi JSON dosyasına kaydet
      numbersData[numberIndex].lastBalance = balance;
      writeNumbersData(numbersData);

      // Sonucu kullanıcıya gönder
      return `Häzirki balans: ${balance}${diffMessage}`;
   } else {
      return "Balans maglumatlaryny ulgamdan alyp bolmady. Soňrak gaýtadan synanyşyň.";
   }
}
