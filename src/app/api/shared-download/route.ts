import { NextRequest, NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { CHANNEL_IDS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject");
    const id = searchParams.get("id");

    if (!subject || !id) {
      return NextResponse.json({ error: "Missing subject or id" }, { status: 400 });
    }

    const subjectChannels = CHANNEL_IDS[subject as keyof typeof CHANNEL_IDS];
    if (!subjectChannels || !subjectChannels.Public) {
      return NextResponse.json({ error: "Invalid subject or public channel not found" }, { status: 400 });
    }
    const channelId = subjectChannels.Public;

    // Connect to Telegram
    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION),
      parseInt(process.env.TELEGRAM_API_ID || ""),
      process.env.TELEGRAM_API_HASH || "",
      {
        connectionRetries: 5,
        useWSS: true,
        timeout: 30000,
      }
    );
    await client.connect();

    // Fetch the message
    const messages = await client.getMessages(channelId.toString(), { ids: parseInt(id) });
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (
      !message ||
      !message.media ||
      message.media.className !== 'MessageMediaDocument' ||
      !message.media.document ||
      !("attributes" in message.media.document) ||
      !("mimeType" in message.media.document)
    ) {
      await client.disconnect();
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Download the file
    const buffer = await client.downloadMedia(message, {});
    const fileNameAttr = message.media.document.attributes?.find(
      (attr: any) => attr.className === 'DocumentAttributeFilename' && 'fileName' in attr
    ) as { fileName?: string } | undefined;
    const fileName = fileNameAttr?.fileName || 'file';
    const mimeType = message.media.document.mimeType || 'application/octet-stream';

    await client.disconnect();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to download file", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 