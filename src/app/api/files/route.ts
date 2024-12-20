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
} as const;

type SubjectName = keyof typeof CHANNEL_IDS;
type ChannelType = keyof typeof CHANNEL_IDS[SubjectName];

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = new URL(request.url).searchParams;
    const subject = searchParams.get("subject") as SubjectName | null;
    const type = searchParams.get("type") as ChannelType | null;

    if (!subject || !type || !(subject in CHANNEL_IDS) || !(type in CHANNEL_IDS[subject])) {
      return NextResponse.json({ error: "Invalid subject or type" }, { status: 400 });
    }

    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      { connectionRetries: 5 }
    );

    await client.connect();

    try {
      const channelId = CHANNEL_IDS[subject][type];

      // Get user's owned messages in this channel
      const ownedMessages = await prisma.messageOwnership.findMany({
        where: {
          userId: user.id,
          channelId: channelId,
        },
        select: {
          messageId: true,
        },
      });

      const ownedMessageIds = new Set(ownedMessages.map(m => Number(m.messageId)));

      const messages = await client.getMessages(channelId.toString(), {
        limit: 100,
      });

      const files = messages
        .filter((msg): msg is Api.Message => {
          if (!msg || !msg.media) return false;
          return ('document' in msg.media) || ('photo' in msg.media);
        })
        .map(msg => {
          if ('photo' in msg.media!) {
            const photo = msg.media.photo as Api.Photo;
            const photoSize = photo.sizes[photo.sizes.length - 1];
            return {
              id: msg.id.toString(),
              name: `photo_${msg.id}.jpg`,
              size: 'size' in photoSize ? photoSize.size : 0,
              uploadedAt: new Date(msg.date * 1000).toISOString(),
              url: `/api/files/${msg.id}`,
              type: 'photo',
              isFavorite: false
            };
          } else if (msg.media && 'document' in msg.media) {
            const document = msg.media.document as Api.Document;
            const fileName = document.attributes
              .find((attr): attr is Api.DocumentAttributeFilename => 
                attr.className === 'DocumentAttributeFilename'
              )?.fileName;

            // Get file name from caption if not found in attributes
            const captionFileName = msg.message?.match(/Uploaded by .+?: (.+)$/)?.[1];
            
            return {
              id: msg.id.toString(),
              name: fileName || captionFileName || `file_${msg.id}`,
              size: document.size,
              uploadedAt: new Date(msg.date * 1000).toISOString(),
              url: `/api/files/${msg.id}`,
              type: 'document',
              isFavorite: false
            };
          }
        });

      return NextResponse.json(files);
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 