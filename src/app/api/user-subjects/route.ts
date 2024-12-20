import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.userSubject.findMany({
      where: {
        clerkId: userId,
      },
      select: {
        subject: true,
      },
      distinct: ['subject'],
    });

    console.log("Fetched subjects for user:", subjects);

    return NextResponse.json(subjects.map(s => s.subject));
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching user subjects:", error.message);
    } else if (typeof error === 'string') {
      console.error("Error fetching user subjects:", error);
    } else {
      console.error("Unexpected error fetching user subjects:", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 