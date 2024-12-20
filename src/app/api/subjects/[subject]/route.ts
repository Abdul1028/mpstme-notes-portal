import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subject: string } }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subject = decodeURIComponent(params.subject) as SubjectName;
    if (!subject || !(subject in CHANNEL_IDS)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize Telegram client
    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      { connectionRetries: 5 }
    );

    await client.connect();

    try {
      // Leave all channels for this subject
      for (const type of ["Main", "Theory", "Practical"] as const) {
        const channelId = CHANNEL_IDS[subject][type];
        
        try {
          await client.invoke(new Api.channels.LeaveChannel({
            channel: channelId
          }));
        } catch (error) {
          console.error(`Failed to leave channel ${channelId} for ${subject} ${type}:`, error);
          // Continue with other channels even if one fails
        }
      }

      // Delete all subject entries from database
      await prisma.userSubject.deleteMany({
        where: {
          clerkId: userId,
          subject: subject,
        },
      });

      // Delete all files for this subject
      await prisma.file.deleteMany({
        where: {
          userId: user.id,
          subject: subject,
        },
      });

      return NextResponse.json({ success: true });
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Error removing subject:", error);
    return NextResponse.json(
      { error: "Failed to remove subject" },
      { status: 500 }
    );
  }
} 