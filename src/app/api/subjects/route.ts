import { NextRequest, NextResponse } from 'next/server';
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
};

// To fix TypeScript errors, let's add some type definitions
type SubjectName = keyof typeof CHANNEL_IDS;
type ChannelType = "Main" | "Theory" | "Practical";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User ID:", userId);

    // Attempt to upsert user
    try {
      await prisma.user.upsert({
        where: { clerkId: userId }, // Ensure this is the Clerk ID
        update: {},
        create: {
          clerkId: userId,
        },
      });
    } catch (error) {
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    const { subjects } = await req.json();
    console.log("Received subjects:", subjects);

    // Validate subjects
    if (!Array.isArray(subjects) || subjects.length === 0) {
      console.error("Invalid subjects array:", subjects);
      return new NextResponse("Invalid subjects", { status: 400 });
    }

    // Initialize Telegram client
    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

    // For each selected subject, add user to channels and store preferences
    for (const subject of subjects as SubjectName[]) {
      const channelTypes: ChannelType[] = ["Main", "Theory", "Practical"];
      
      for (const type of channelTypes) {
        const channelId = CHANNEL_IDS[subject]?.[type]; // Use optional chaining

        // Validate channelId
        if (!channelId) {
          continue; // Skip to the next type without logging
        }

        console.log(`Attempting to join channel: ${channelId} for subject: ${subject}, type: ${type}`);

        // Join the channel
        try {
          await client.invoke(new Api.channels.JoinChannel({
            channel: channelId.toString()
          }));
        } catch (error) {
          console.error(`Failed to join channel for ${subject} ${type}:`, error);
          continue; // Skip to the next type
        }

        // Store the preference using Clerk user ID
        try {
          await prisma.userSubject.upsert({
            where: {
              clerkId_subject_type: {
                clerkId: userId,
                subject,
                type,
              },
            },
            update: {},
            create: {
              clerkId: userId,
              subject,
              channelId,
              type,
            },
          });
        } catch (error) {
          console.error("Error upserting userSubject:", error);
          continue; // Skip to the next subject/type
        }
      }
    }

    await client.disconnect();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Improved error handling
    if (error instanceof Error) {
      console.error("Error handling subject selection:", error.message);
    } else if (typeof error === 'string') {
      console.error("Error handling subject selection:", error);
    } else {
      console.error("Unexpected error handling subject selection:", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const subjects = await prisma.userSubject.findMany({
      where: {
        user: {
          id: user.id
        },
        type: "Main",
      },
      select: {
        subject: true,
      },
    });

    return NextResponse.json(subjects.map(s => s.subject));
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 