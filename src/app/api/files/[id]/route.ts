import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";

const CHANNEL_IDS = {
  "Advanced Java": {
    Main: -1002354703805n,
    Theory: -1002380915545n,
    Practical: -1002428084012n,
  },
  "Data Analytics with Python": {
    Main: -1002440181008n,
    Theory: -1002453320466n,
    Practical: -1002428199055n,
  },
  "Human Computer Interface": {
    Main: -1002384952840n,
    Theory: -1002445086870n,
    Practical: -1002227802139n,
  },
  "Mobile Application Development": {
    Main: -1002255805116n,
    Theory: -1002279502965n,
    Practical: -1002342357608n,
  },
  "Probability Statistics": {
    Main: -1002276329421n,
    Theory: -1002321230535n,
    Practical: -1002493518633n,
  },
  "Software Engineering": {
    Main: -1002370893044n,
    Theory: -1002344359474n,
    Practical: -1002424851036n,
  }
} as const;

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
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      { connectionRetries: 5 }
    );

    await client.connect();

    try {
      const messageId = parseInt(id);
      if (isNaN(messageId)) {
        return new NextResponse("Invalid message ID", { status: 400 });
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
        return new NextResponse("File not found", { status: 404 });
      }

      const buffer = await client.downloadMedia(foundMessage.media);
      
      if ('document' in foundMessage.media) {
        const document = foundMessage.media.document as Api.Document;
        const fileName = document.attributes.find(
          (attr): attr is Api.DocumentAttributeFilename => 
            attr.className === "DocumentAttributeFilename"
        )?.fileName || `file_${foundMessage.id}`;

        // For all files, force download
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": document.mimeType || "application/octet-stream",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-cache",
          },
        });
      }

      // For any other type of media, force download
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="file_${foundMessage.id}"`,
          "Cache-Control": "no-cache",
        },
      });

    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Error downloading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 