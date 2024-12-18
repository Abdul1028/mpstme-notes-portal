import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { createInterface } from "readline/promises";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
console.log(apiId, apiHash);

if (!apiId || !apiHash) {
    throw new Error("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env.local");
}

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = async (question: string) => {
    const answer = await readline.question(question);
    return answer;
};

(async () => {
    try {
        const client = new TelegramClient(new StringSession(""), Number(apiId), apiHash, {
            connectionRetries: 5,
        });

        await client.start({
            phoneNumber: async () => await askQuestion("Phone number: "),
            password: async () => await askQuestion("Password (if any): "),
            phoneCode: async () => await askQuestion("Verification code: "),
            onError: (err: Error) => console.log(err),
        });

        console.log("\nSession string:", client.session.save());
        await client.disconnect();
    } catch (error) {
        console.error("Error:", error);
    } finally {
        readline.close();
    }
})();