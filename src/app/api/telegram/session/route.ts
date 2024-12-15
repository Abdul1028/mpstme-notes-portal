import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        sessionString: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user?.sessionString) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session: user });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Failed to check session" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionString } = await req.json();

    // Validate session string by attempting to connect
    const client = new TelegramClient(
      new StringSession(sessionString),
      Number(apiId),
      apiHash,
      { connectionRetries: 5 }
    );

    await client.connect();
    const me = await client.getMe();
    await client.disconnect();

    // Save or update user's session
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        sessionString,
        telegramId: me.id.toString(),
        username: me.username,
        firstName: me.firstName,
        lastName: me.lastName,
      },
      create: {
        clerkId: userId,
        sessionString,
        telegramId: me.id.toString(),
        username: me.username,
        firstName: me.firstName,
        lastName: me.lastName,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { error: "Invalid session string" },
      { status: 400 }
    );
  }
}