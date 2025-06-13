import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION;

if (!apiId || !apiHash || !sessionString) {
  throw new Error("TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION must be set in .env.local");
}

const PREDEFINED_SUBJECTS = [
  "Advanced Java",
  "Data Analytics with Python",
  "Human Computer Interface",
  "Mobile Application Development",
  "Probability Statistics",
  "Software Engineering"
];

async function createChannel(client: TelegramClient, title: string, about: string) {
  try {
    console.log(`Creating channel: ${title}`);
    const result = await client.invoke(new Api.channels.CreateChannel({
      title,
      about,
      megagroup: true,
      broadcast: false
    }));

    // Get the created channel from updates
    const updates = result as any;
    const channel = updates.chats?.find((chat: any) => 
      chat.title === title
    );
    
    if (!channel) {
      throw new Error('Failed to create channel');
    }

    // Generate invite link
    const inviteResult = await client.invoke(new Api.messages.ExportChatInvite({
      peer: channel,
      title: "Join Channel"
    })) as any;

    return {
      id: channel.id,
      title: channel.title,
      inviteLink: inviteResult?.link || null
    };
  } catch (error) {
    console.error(`Error creating channel ${title}:`, error);
    throw error;
  }
}

async function getAllChannels(client: TelegramClient) {
  const dialogs = await client.getDialogs({});
  return Array.from(dialogs)
    .filter(d => d.isChannel)
    .map(c => ({
      title: c.title,
      id: c.id,
      type: c.title?.includes('-Theory') ? 'Theory' :
            c.title?.includes('-Practical') ? 'Practical' :
            c.title?.includes('-Public') ? 'Public' : 'Main'
    }))
    .sort((a, b) => a.title?.localeCompare(b.title || '') || 0);
}

async function setupChannels() {
  const client = new TelegramClient(
    new StringSession(sessionString as string),
    parseInt(apiId as string),
    apiHash as string,
    {
      connectionRetries: 5,
    }
  );

  try {
    await client.connect();
    console.log("Connected to Telegram");

    // Get existing channels
    const existingChannels = await getAllChannels(client);
    const existingTitles = existingChannels.map(c => c.title);

    console.log("\nExisting channels:", existingTitles);

    // Check which subjects and their subchannels need to be created
    for (const subject of PREDEFINED_SUBJECTS) {
      const requiredChannels = [
        subject,
        `${subject}-Theory`,
        `${subject}-Practical`,
        `${subject}-Public`
      ];

      for (const channelTitle of requiredChannels) {
        if (!existingTitles.includes(channelTitle)) {
          try {
            console.log(`Creating missing channel: ${channelTitle}`);
            const channel = await createChannel(
              client,
              channelTitle,
              `Channel for ${channelTitle}`
            );
            console.log(`Successfully created: ${channelTitle}`);
          } catch (error) {
            console.error(`Failed to create channel ${channelTitle}:`, error);
            continue;
          }
        } else {
          console.log(`Channel already exists: ${channelTitle}`);
        }
      }
    }

    // Get final list of all channels
    const finalChannels = await getAllChannels(client);
    
    console.log("\n=== FINAL CHANNEL SUMMARY ===");
    console.log("\nMain Channels:");
    finalChannels
      .filter(c => c.type === 'Main')
      .forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));
    
    console.log("\nTheory Channels:");
    finalChannels
      .filter(c => c.type === 'Theory')
      .forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));
    
    console.log("\nPractical Channels:");
    finalChannels
      .filter(c => c.type === 'Practical')
      .forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));

    console.log("\nPublic Channels:");
    finalChannels
      .filter(c => c.type === 'Public')
      .forEach(c => console.log(`- ${c.title} (ID: ${c.id})`));

    console.log("\nTotal Channels:", finalChannels.length);
    console.log("Channel setup completed!");

  } catch (error) {
    console.error("Error setting up channels:", error);
    throw error;
  } finally {
    await client.disconnect();
  }
}

// Run the setup
setupChannels().catch(console.error);