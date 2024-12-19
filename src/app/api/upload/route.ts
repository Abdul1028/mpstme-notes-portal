import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma'; // Import your Prisma client

const CHANNEL_IDS = {
  "Advanced Java": {
    Main: -1002354703805,
    Theory: -1002380915545,
    Practical: -1002428084012,
  },
  "Data Analytics with Python": {
    Main: -1002440181008,
    Theory: -1002453320466,
    Practical: -1002428199055,
  },
  "Human Computer Interface": {
    Main: -1002384952840,
    Theory: -1002445086870,
    Practical: -1002227802139,
  },
  "Mobile Application Development": {
    Main: -1002255805116,
    Theory: -1002279502965,
    Practical: -1002342357608,
  },
  "Probability Statistics": {
    Main: -1002276329421,
    Theory: -1002321230535,
    Practical: -1002493518633,
  },
  "Software Engineering": {
    Main: -1002370893044,
    Theory: -1002344359474,
    Practical: -1002424851036,
  }
} as const;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const subject = formData.get('subject');
  const uploadType = formData.get('uploadType');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, file.name);
  const fileStream = fs.createWriteStream(filePath);
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  fileStream.write(fileBuffer);
  fileStream.end();

  const { userId } = getAuth(request);
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const client = new TelegramClient(
    new StringSession(process.env.TELEGRAM_SESSION!),
    parseInt(process.env.TELEGRAM_API_ID!),
    process.env.TELEGRAM_API_HASH!,
    {
      connectionRetries: 5,
    }
  );

  await client.connect();

  const channelId = CHANNEL_IDS[subject]?.[uploadType || "Main"];
  if (!channelId) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  try {
    await client.sendFile(channelId, {
      file: filePath,
      caption: `Uploaded by user ${userId}: ${file.name}`,
    });

    // await prisma.file.create({
    //   data: {
    //     name: file.name,
    //     size: file.size,
    //     url: filePath,
    //     userId: userId,
    //     subject: subject,
    //     type: uploadType || "Main",
    //   },
    // });
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error uploading to Telegram:', error.message);
      return NextResponse.json({ error: `Failed to upload to Telegram: ${error.message}` }, { status: 500 });
    } else {
      console.error('Unexpected error:', error);
      return NextResponse.json({ error: 'Failed to upload to Telegram: Unexpected error occurred' }, { status: 500 });
    }
  } finally {
    await client.disconnect();
  }

  fs.unlinkSync(filePath); // Optionally delete the file after upload

  return NextResponse.json({ message: 'File uploaded successfully to Telegram' });
} 