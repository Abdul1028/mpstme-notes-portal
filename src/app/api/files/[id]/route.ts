import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { prisma } from "@/lib/prisma";

const CHANNEL_IDS = {
  "Advanced Java": {
    Main: BigInt("-1002354703805"),
    Theory: BigInt("-1002380915545"),
    Practical: BigInt("-1002428084012"),
  },
  "Data Analytics with Python": {
    Main: BigInt("-1002440181008"),
    Theory: BigInt("-1002453320466"),
    Practical: BigInt("-1002428199055"),
  },
  "Human Computer Interface": {
    Main: BigInt("-1002384952840"),
    Theory: BigInt("-1002445086870"),
    Practical: BigInt("-1002227802139"),
  },
  "Mobile Application Development": {
    Main: BigInt("-1002255805116"),
    Theory: BigInt("-1002279502965"),
    Practical: BigInt("-1002342357608"),
  },
  "Probability Statistics": {
    Main: BigInt("-1002276329421"),
    Theory: BigInt("-1002321230535"),
    Practical: BigInt("-1002493518633"),
  },
  "Software Engineering": {
    Main: BigInt("-1002370893044"),
    Theory: BigInt("-1002344359474"),
    Practical: BigInt("-1002424851036"),
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

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
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

    const fileId = await Promise.resolve(context.params.id);
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Increment download count
    try {
      await prisma.file.update({
        where: { id: fileId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      });
    } catch (dbError) {
      // Log the error but continue with the download
      console.error("Error updating download count:", 
        dbError instanceof Error ? dbError.message : "Unknown error"
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
          const messages = await client.getMessages(channelId, {
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