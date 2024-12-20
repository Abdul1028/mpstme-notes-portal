import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { Message } from "telegram/tl/custom/message";

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

type SubjectName = keyof typeof CHANNEL_IDS;
type ChannelType = keyof typeof CHANNEL_IDS[SubjectName];

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      const messages = await client.getMessages(channelId, {
        limit: 100,
      });

      const files = messages
        .filter((msg): msg is Message => {
          return !!msg && (
            (!!msg.media && 'document' in msg.media) || 
            (!!msg.media && 'photo' in msg.media)
          );
        })
        .map(msg => {
          if ('photo' in msg.media!) {
            const photo = msg.media.photo as Api.Photo;
            return {
              id: msg.id.toString(),
              name: `photo_${msg.id}.jpg`,
              size: photo.sizes[photo.sizes.length - 1].size || 0,
              uploadedAt: new Date(msg.date * 1000).toISOString(),
              url: `/api/files/${msg.id}`,
              type: 'photo'
            };
          } else {
            const document = msg.media?.document as Api.Document;
            return {
              id: msg.id.toString(),
              name: document.attributes.find((attr): attr is Api.DocumentAttributeFilename => 
                attr.className === 'DocumentAttributeFilename'
              )?.fileName || "Unnamed File",
              size: document.size,
              uploadedAt: new Date(msg.date * 1000).toISOString(),
              url: `/api/files/${msg.id}`,
              type: 'document'
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