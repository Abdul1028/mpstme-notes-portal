import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";
import { CustomFile } from "telegram/client/uploads";
import fs from "fs";
import path from "path";

// Define channel IDs for different subjects and upload types
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
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    const userId = user.id;

    console.log("[Upload] Starting upload process...");
    const formData = await request.formData();
    const chunksRaw = formData.get("chunks");
    const chunks = chunksRaw ? JSON.parse(chunksRaw as string) as string[] : [];
    const blobUrl = formData.get("blobUrl") as string;
    const fileName = formData.get("fileName") as string;
    const subject = formData.get("subject") as string;
    const uploadType = formData.get("uploadType") as string;

    console.log("[Upload] Received form data:", {
      fileName,
      subject,
      uploadType,
      chunksCount: Array.isArray(chunks) ? chunks.length : 0,
      hasBlobUrl: !!blobUrl
    });

    if ((!chunks || !Array.isArray(chunks) || chunks.length === 0) && !blobUrl) {
      throw new Error(`Missing required fields`);
    }

    let fileBuffer: Buffer;
    if (chunks && Array.isArray(chunks) && chunks.length > 0) {
      // Download and combine chunks in parallel
      console.log("[Upload] Downloading chunks...");
      const chunkBuffers = await Promise.all(
        chunks.map(async (chunkUrl) => {
          const response = await fetch(chunkUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch chunk: ${response.status}`);
          }
          return Buffer.from(await response.arrayBuffer());
        })
      );
      // Combine chunks
      fileBuffer = Buffer.concat(chunkBuffers);
      console.log("[Upload] File combined, size:", fileBuffer.length, "bytes");
    } else if (blobUrl) {
      // Simple upload logic
      console.log("[Upload] Downloading file from blobUrl...");
      const response = await fetch(blobUrl);
      if (!response.ok) throw new Error("Failed to download file from blob storage");
      fileBuffer = Buffer.from(await response.arrayBuffer());
      console.log("[Upload] File downloaded from blobUrl, size:", fileBuffer.length, "bytes");
    } else {
      throw new Error("No file data provided");
    }

    if (fileBuffer.length > 200 * 1024 * 1024) {
      throw new Error("File size exceeds Telegram's limit (200MB)");
    }

    // Initialize Telegram client with optimized settings
    client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      { 
        connectionRetries: 5,
        timeout: 60000, // Increased timeout
        useWSS: true, // Use WebSocket for better performance
        deviceModel: "Desktop",
        systemVersion: "Windows 10",
        appVersion: "1.0.0",
        langCode: "en",
        systemLangCode: "en"
      }
    );

    await client.connect();
    console.log("[Upload] Connected to Telegram");

    const channelId = CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS]?.[uploadType as keyof (typeof CHANNEL_IDS)[keyof typeof CHANNEL_IDS]];
    if (!channelId) {
      throw new Error(`Invalid subject or upload type: ${subject} - ${uploadType}`);
    }

    // Create custom file with optimized settings
    const file = new CustomFile(
      fileName,
      fileBuffer.length,
      "",
      fileBuffer
    );

    console.log("[Upload] Uploading to Telegram channel:", channelId.toString());

    // Upload with optimized settings
    const result = await client.sendFile(channelId.toString(), {
      file: file,
      forceDocument: true,
      caption: fileName,
      workers: 4, // Use multiple workers for upload
    }).catch(error => {
      console.error("[Upload] Detailed upload error:", error);
      throw new Error(`Telegram upload failed: ${error.message}`);
    });

    console.log("[Upload] Telegram upload complete!");

    // Save message ownership
    await prisma.messageOwnership.create({
      data: {
        messageId: BigInt(result.id),
        channelId: channelId,
        userId: userId,
      },
    });

    // Clean up chunks from blob storage
    console.log("[Upload] Cleaning up chunks...");
    await Promise.all(
      chunks.map(chunkUrl => 
        fetch(chunkUrl, { method: 'DELETE' })
          .catch(err => console.error('Failed to delete chunk:', err))
      )
    );

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  } finally {
    if (client) {
        await client.disconnect();
    }
  }
}

