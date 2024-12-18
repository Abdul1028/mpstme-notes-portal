import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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

// To fix TypeScript errors, let's add some type definitions
type SubjectName = keyof typeof CHANNEL_IDS;
type ChannelType = "Main" | "Theory" | "Practical";

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req); // This is the Clerk user ID
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
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
            channel: channelId
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

export async function GET(req: Request) {
  try {
    const { userId } = getAuth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.User.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const subjects = await prisma.userSubject.findMany({
      where: {
        userId: user.id,
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