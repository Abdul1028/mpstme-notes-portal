import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { prisma } from "@/lib/prisma";
import { CustomFile } from "telegram/client/uploads";

const CHANNEL_IDS = {
  "Advanced Java": {
    Main: BigInt("-1002392486470"),
    Theory: BigInt("-1002390876365"),
    Practical: BigInt("-1002254568649"),
  },
  "Data Analytics with Python": {
    Main: BigInt("-1002428431170"),
    Theory: BigInt("-1002355222084"),
    Practical: BigInt("-1002301366458"),
  },
  "Human Computer Interface": {
    Main: BigInt("-1002274201455"),
    Theory: BigInt("-1002428841710"),
    Practical: BigInt("-1002462133059"),
  },
  "Mobile Application Development": {
    Main: BigInt("-1002390629719"),
    Theory: BigInt("-1002313593362"),
    Practical: BigInt("-1002453803465"),
  },
  "Probability Statistics": {
    Main: BigInt("-1002277439553"),
    Theory: BigInt("-1002466989253"),
    Practical: BigInt("-1002260169268"),
  },
  "Software Engineering": {
    Main: BigInt("-1002342125939"),
    Theory: BigInt("-1002345923267"),
    Practical: BigInt("-1002449513822"),
  }
};

export async function POST(request: NextRequest) {
  const { userId: clerkId } = getAuth(request);
  let client: TelegramClient | null = null;

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First get the internal user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    const userId = user.id; // This is the internal database ID

    console.log("[Upload] Starting upload process...");
    const formData = await request.formData();
    const blobUrl = formData.get("blobUrl") as string;
    const fileName = formData.get("fileName") as string;
    const subject = formData.get("subject") as string;
    const uploadType = formData.get("uploadType") as string;

    console.log("[Upload] Received form data:", {
      fileName,
      subject,
      uploadType,
      blobUrl: blobUrl?.substring(0, 50) + "..."
    });

    if (!blobUrl || !fileName || !subject || !uploadType) {
      throw new Error(`Missing required fields`);
    }

    // Download file from blob URL
    console.log("[Upload] Downloading from blob storage...");
    const fileResponse = await fetch(blobUrl).catch(error => {
      throw new Error(`Failed to fetch from blob storage: ${error.message}`);
    });

    if (!fileResponse.ok) {
      throw new Error(`Blob fetch failed with status: ${fileResponse.status}`);
    }
    
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    console.log("[Upload] File downloaded, size:", fileBuffer.length, "bytes");

    // Initialize Telegram client
    console.log("[Upload] Initializing Telegram client...");
    client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      { 
        connectionRetries: 5,
        timeout: 30000
      }
    );

    await client.connect();
    console.log("[Upload] Connected to Telegram");

    // Get channel ID
    const channelId = CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS]?.[uploadType as keyof (typeof CHANNEL_IDS)[keyof typeof CHANNEL_IDS]];
    if (!channelId) {
      throw new Error(`Invalid subject or upload type: ${subject} - ${uploadType}`);
    }

    // Create custom file for upload
    const file = new CustomFile(
      fileName,
      fileBuffer.length,
      "",
      fileBuffer
    );

    console.log("[Upload] Uploading to Telegram channel:", channelId.toString());
    const result = await client.sendFile(channelId.toString(), {
      file,
      forceDocument: true,
      caption: fileName,
    }).catch(error => {
      throw new Error(`Telegram upload failed: ${error.message}`);
    });

    console.log("[Upload] Telegram upload complete!");

    // Save message ownership with correct userId
    await prisma.messageOwnership.create({
      data: {
        messageId: BigInt(result.id),
        channelId: channelId,
        userId: userId, // Using internal database ID
      },
    });

    // Delete from Blob storage
    console.log("[Upload] Deleting from blob storage...");
    await del(blobUrl).catch(error => {
      console.warn("[Upload] Failed to delete blob:", error.message);
    });

    return NextResponse.json({ 
      success: true,
      fileUrl: `https://t.me/c/${channelId.toString().replace('-100', '')}/${result.id}`
    });

  } catch (error) {
    console.error("[Upload] Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }, { status: 500 });

  } finally {
    if (client) {
      try {
        await client.disconnect();
        console.log("[Upload] Telegram client disconnected");
      } catch (error) {
        console.warn("[Upload] Error disconnecting client:", error);
      }
    }
  }
} 