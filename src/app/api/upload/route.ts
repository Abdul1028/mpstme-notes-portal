import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { prisma } from "@/lib/prisma";
import { CustomFile } from "telegram/client/uploads";

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const subject = formData.get("subject") as string;
    const uploadType = formData.get("uploadType") as string;

    if (!file || !subject || !uploadType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!(subject in CHANNEL_IDS) || !(uploadType in CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS])) {
      return NextResponse.json(
        { error: "Invalid subject or upload type" },
        { status: 400 }
      );
    }

    const channelId = CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS][uploadType as keyof (typeof CHANNEL_IDS)[keyof typeof CHANNEL_IDS]];

    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION!),
      parseInt(process.env.TELEGRAM_API_ID!),
      process.env.TELEGRAM_API_HASH!,
      { connectionRetries: 5 }
    );

    await client.connect();

    try {
      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Create a CustomFile instance
      const customFile = new CustomFile(
        file.name,
        buffer.length,
        file.name,
        buffer
      );

      // Upload file to Telegram
      const result = await client.sendFile(channelId.toString(), {
        file: customFile,
        caption: `Uploaded by ${userId}: ${file.name}`,
        forceDocument: true,
      });

      if (!result || !result.id) {
        throw new Error("Failed to upload file");
      }

      // Track message ownership
      await prisma.messageOwnership.create({
        data: {
          messageId: BigInt(result.id),
          channelId: channelId,
          userId: user.id,
        },
      });

      return NextResponse.json({
        success: true,
        messageId: result.id,
        fileName: file.name,
      });
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
} 