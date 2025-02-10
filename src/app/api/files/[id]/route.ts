import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { prisma } from "@/lib/prisma";

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

// Helper function to get content type
function getContentType(fileName: string, defaultType = "application/octet-stream") {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
  };

  return mimeTypes[extension || ''] || defaultType;
}

type Context = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const client = new TelegramClient(
    new StringSession(process.env.TELEGRAM_SESSION!),
    parseInt(process.env.TELEGRAM_API_ID!),
    process.env.TELEGRAM_API_HASH!,
    { connectionRetries: 5 }
  );

  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const fileId = id;
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    await client.connect();

    const messageId = parseInt(fileId);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 }
      );
    }

    let foundMessage = null;

    for (const subject of Object.values(CHANNEL_IDS)) {
      for (const channelId of Object.values(subject)) {
        try {
          const messages = await client.getMessages(channelId.toString(), {
            ids: [messageId],
          });
          if (messages[0]?.media) {
            foundMessage = messages[0];
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (foundMessage) break;
    }

    if (!foundMessage || !foundMessage.media) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const buffer = await client.downloadMedia(foundMessage.media);
    if (!buffer) {
      throw new Error("Failed to download file from Telegram");
    }

    let fileName = 'file';
    let contentType = 'application/octet-stream';

    if ('document' in foundMessage.media) {
      const document = foundMessage.media.document as Api.Document;
      fileName = document.attributes.find(
        (attr): attr is Api.DocumentAttributeFilename => 
          attr.className === "DocumentAttributeFilename"
      )?.fileName || `file_${foundMessage.id}`;
      contentType = document.mimeType || getContentType(fileName);
    } else if ('photo' in foundMessage.media) {
      fileName = `photo_${foundMessage.id}.jpg`;
      contentType = 'image/jpeg';
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error("Error downloading file:", 
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  } finally {
    try {
      await client.disconnect();
    } catch (disconnectError) {
      console.error("Error disconnecting client:", 
        disconnectError instanceof Error ? disconnectError.message : "Unknown error"
      );
    }
  }
} 


