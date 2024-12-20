import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user subjects with channel IDs
    const userSubjects = await prisma.userSubject.findMany({
      where: {
        clerkId: userId, // Ensure this matches your schema
      },
      select: {
        channelId: true, // Include channelId in the response
      },
    });

    console.log("Fetched user channels:", userSubjects);

    // Extract channel IDs and convert BigInt to string
    const channelIds = userSubjects.map(subject => subject.channelId.toString());

    return NextResponse.json(channelIds);
  } catch (error) {
    console.error("Error fetching user channels:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 