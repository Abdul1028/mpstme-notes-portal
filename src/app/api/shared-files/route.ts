import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";
import { CHANNEL_IDS } from "@/lib/constants";

// Type guard for message.media
function hasFileProps(media: any): media is { fileName?: string; fileSize?: number; url?: string; mimeType?: string } {
  return media && (typeof media.fileName === 'string' || typeof media.fileSize === 'number' || typeof media.url === 'string' || typeof media.mimeType === 'string');
}

// Type guard for message
function isFileMessage(message: any): boolean {
  // Log the full message for debugging
  console.log("[Shared Files] Checking message:", JSON.stringify(message, null, 2));
  
  // Check if it's a regular message with media
  const isRegularMessage = message && message.className === 'Message';
  const hasMedia = message?.media && (
    message.media.className === 'MessageMediaDocument' ||
    message.media.className === 'MessageMediaPhoto' ||
    message.media.className === 'MessageMediaWebPage'
  );
  
  console.log("[Shared Files] Message check result:", {
    id: message?.id,
    isRegularMessage,
    hasMedia,
    mediaType: message?.media?.className,
    fileName: message?.media?.document?.attributes?.find((attr: any) => attr.className === 'DocumentAttributeFilename')?.fileName,
    fileSize: message?.media?.document?.size,
    mimeType: message?.media?.document?.mimeType
  });
  
  return isRegularMessage && hasMedia;
}

// Initialize Telegram client
const client = new TelegramClient(
  new StringSession(process.env.TELEGRAM_SESSION || ""),
  Number(process.env.TELEGRAM_API_ID),
  process.env.TELEGRAM_API_HASH || "",
  {
    connectionRetries: 5,
    timeout: 30000,
    useWSS: true,
  }
);

// Define the file type interface
interface SharedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
  type: string;
  isFavorite: boolean;
  uploadedBy: string;
  subject: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("[Shared Files] GET called");
    
    // Check environment variables
    if (!process.env.TELEGRAM_SESSION || !process.env.TELEGRAM_API_ID || !process.env.TELEGRAM_API_HASH) {
      console.error("[Shared Files] Missing required environment variables");
      return NextResponse.json(
        { error: "Server configuration error: Missing Telegram credentials" },
        { status: 500 }
      );
    }

    console.log("[Shared Files] Environment:", {
      TELEGRAM_SESSION: !!process.env.TELEGRAM_SESSION,
      TELEGRAM_API_ID: process.env.TELEGRAM_API_ID,
      TELEGRAM_API_HASH: !!process.env.TELEGRAM_API_HASH,
    });

    const { userId } = getAuth(request);
    console.log("[Shared Files] userId:", userId);
    if (!userId) {
      console.warn("[Shared Files] Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get subject from query params
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    console.log("[Shared Files] Requested subject:", subject);

    // Log channel IDs
    console.log("[Shared Files] CHANNEL_IDS:", CHANNEL_IDS);
    if (!CHANNEL_IDS || Object.keys(CHANNEL_IDS).length === 0) {
      console.error("[Shared Files] No channel IDs configured");
      return NextResponse.json(
        { error: "Server configuration error: No channels configured" },
        { status: 500 }
      );
    }

    // If no subject is specified, return files from all public channels
    const channelsToFetch = subject 
      ? [{ subject, channelId: CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS]?.Public }]
      : Object.entries(CHANNEL_IDS).map(([subject, ids]) => ({ 
          subject, 
          channelId: ids.Public 
        }));

    console.log("[Shared Files] Channels to fetch:", channelsToFetch);

    // Connect to Telegram
    try {
      await client.connect();
      console.log("[Shared Files] Connected to Telegram");
    } catch (err) {
      console.error("[Shared Files] Failed to connect to Telegram:", err);
      return NextResponse.json(
        { error: "Failed to connect to Telegram service" },
        { status: 500 }
      );
    }

    // Get messages from all specified channels
    let allFiles: SharedFile[] = [];
    for (const { subject, channelId } of channelsToFetch) {
      if (!channelId) {
        console.warn(`[Shared Files] No public channel found for subject: ${subject}`);
        continue;
      }

      try {
        console.log(`[Shared Files] Fetching messages from channel ${channelId} (${subject})...`);
        
        // First, get the channel entity
        const channel = await client.getEntity(channelId.toString());
        console.log(`[Shared Files] Channel entity:`, channel);
        
        // Then fetch messages
        const messages = await client.getMessages(channel, {
          limit: 100,
          waitTime: 2,
        });
        
        console.log(`[Shared Files] Raw messages from channel ${channelId}:`, 
          messages.map((m: any) => ({
            id: m.id,
            type: m.className,
            mediaType: m.media?.className,
            message: m.message?.substring(0, 50),
            date: m.date
          }))
        );

        const files = messages
          .filter((message: any) => {
            const isFile = isFileMessage(message);
            return isFile;
          })
          .map((message: any) => {
            // Extract file information based on media type
            let fileName = "Unknown file";
            let fileSize = 0;
            let fileType = "application/octet-stream";
            let fileUrl = "";

            if (message.media?.className === 'MessageMediaDocument') {
              const doc = message.media.document;
              const filenameAttr = doc.attributes?.find((attr: any) => attr.className === 'DocumentAttributeFilename');
              fileName = filenameAttr?.fileName || "Document";
              fileSize = doc.size || 0;
              fileType = doc.mimeType || "application/octet-stream";
            } else if (message.media?.className === 'MessageMediaPhoto') {
              fileName = "Photo";
              fileType = "image/jpeg";
            }

            // Parse username from caption/message
            let uploadedBy = 'Unknown user';
            if (message.message) {
              const match = message.message.match(/Uploaded by: (.+)$/m);
              if (match) uploadedBy = match[1];
            }
            const file = {
              id: message.id.toString(),
              name: fileName,
              size: fileSize,
              uploadedAt: message.date
                ? new Date(
                    typeof message.date === 'number'
                      ? message.date * 1000
                      : message.date
                  ).toISOString()
                : '',
              url: fileUrl,
              type: fileType,
              isFavorite: false,
              uploadedBy: uploadedBy,
              subject: subject,
            };
            return file;
          });

        console.log(`[Shared Files] Found ${files.length} files in channel ${channelId}`);
        allFiles = [...allFiles, ...files];
      } catch (err) {
        console.error(`[Shared Files] Error fetching messages from channel ${channelId} (${subject}):`, err);
        // Continue with other channels even if one fails
      }
    }

    console.log(`[Shared Files] Returning ${allFiles.length} total files:`, allFiles);

    return NextResponse.json(allFiles);

  } catch (error) {
    console.error("[Shared Files] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch files", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    try {
      await client.disconnect();
      console.log("[Shared Files] Disconnected from Telegram");
    } catch (err) {
      console.error("[Shared Files] Error disconnecting from Telegram:", err);
    }
  }
}