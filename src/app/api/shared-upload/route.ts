import { NextResponse, NextRequest } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { CHANNEL_IDS } from "@/lib/constants";
import { Buffer } from "buffer";
import { CustomFile } from "telegram/client/uploads";

// Initialize Telegram client
const client = new TelegramClient(
  new StringSession(process.env.TELEGRAM_SESSION),
  parseInt(process.env.TELEGRAM_API_ID || ""),
  process.env.TELEGRAM_API_HASH || "",
  {
    connectionRetries: 5,
    useWSS: true,
    timeout: 30000,
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log("[Shared Upload] POST called");
    
    // Check environment variables
    if (!process.env.TELEGRAM_SESSION || !process.env.TELEGRAM_API_ID || !process.env.TELEGRAM_API_HASH) {
      console.error("[Shared Upload] Missing required environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing Telegram credentials" },
        { status: 500 }
      );
    }

    // Get authenticated user from Clerk
    const { userId } = getAuth(request);
    if (!userId) {
      console.warn("[Shared Upload] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch Clerk user details
    let username = "Unknown user";
    try {
      const user = await currentUser();
      username = user?.username || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "Unknown user";
    } catch (e) {
      console.warn("[Shared Upload] Could not fetch Clerk user details", e);
    }

    // Parse form data
    const formData = await request.formData();
    const blobUrl = formData.get("blobUrl") as string;
    const fileName = formData.get("fileName") as string;
    const subject = formData.get("subject") as string;

    console.log("[Shared Upload] Form data:", { blobUrl: !!blobUrl, fileName, subject });

    if (!blobUrl || !fileName || !subject) {
      console.error("[Shared Upload] Missing required fields:", { blobUrl: !!blobUrl, fileName, subject });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the public channel ID for the subject
    const subjectChannels = CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS];
    if (!subjectChannels || !subjectChannels.Public) {
      console.error("[Shared Upload] Invalid subject or public channel not found:", subject);
      return NextResponse.json(
        { error: "Invalid subject or public channel not found" },
        { status: 400 }
      );
    }

    const channelId = subjectChannels.Public;
    console.log("[Shared Upload] Using channel ID:", channelId.toString());

    // Download file from blob storage
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        console.error("[Shared Upload] Failed to download file from blob storage:", response.status, response.statusText);
        throw new Error(`Failed to download file from blob storage: ${response.status} ${response.statusText}`);
      }

      const fileBuffer = await response.arrayBuffer();
      const fileData = Buffer.from(fileBuffer);
      console.log("[Shared Upload] Downloaded file size:", fileData.length);

      // Connect to Telegram
      await client.connect();
      console.log("[Shared Upload] Connected to Telegram");

      // Upload file to Telegram channel
      const customFile = new CustomFile(fileName, fileData.length, "", fileData);
      const message = await client.sendFile(channelId.toString(), {
        file: customFile,
        workers: 4,
        forceDocument: true,
        caption: `File: ${fileName}\nUploaded by: ${username}`,
      });
      console.log("[Shared Upload] File uploaded to Telegram, message ID:", message.id);

      // Clean up blob storage
      await fetch(blobUrl, { method: "DELETE" });
      console.log("[Shared Upload] Blob storage cleaned up");

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[Shared Upload] Error during file processing:", error);
      return NextResponse.json(
        { 
          error: "Failed to upload file",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Shared Upload] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    try {
      await client.disconnect();
      console.log("[Shared Upload] Disconnected from Telegram");
    } catch (err) {
      console.error("[Shared Upload] Error disconnecting from Telegram:", err);
    }
  }
} 