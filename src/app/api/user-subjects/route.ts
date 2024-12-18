import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userSubjects = await prisma.userSubject.findMany({
      where: {
        clerkId: userId,
      },
      select: {
        subject: true,
        channelId: true,
      },
    });

    console.log("Fetched user subjects with channel IDs:", userSubjects);

    return NextResponse.json(userSubjects);
  } catch (error) {
    console.error("Error fetching user subjects:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 