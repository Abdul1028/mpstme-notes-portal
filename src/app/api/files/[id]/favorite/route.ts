import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate auth
    const auth = getAuth(request);
    if (!auth || !auth.userId) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get and validate file ID from params
    const fileId = params?.id;
    if (!fileId || typeof fileId !== 'string') {
      return new NextResponse(
        JSON.stringify({ error: "Invalid file ID" }),
        { status: 400 }
      );
    }

    // Get user by clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: user.id,
        fileId: fileId,
      },
    });

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      return new NextResponse(
        JSON.stringify({ isFavorite: false }),
        { status: 200 }
      );
    }

    // Add favorite
    await prisma.favorite.create({
      data: {
        userId: user.id,
        fileId: fileId,
      },
    });
    return new NextResponse(
      JSON.stringify({ isFavorite: true }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error toggling favorite:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to toggle favorite" }),
      { status: 500 }
    );
  }
} 