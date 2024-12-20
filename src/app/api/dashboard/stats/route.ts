import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 60; // Reduced to 1 minute for more frequent updates
const MESSAGES_LIMIT = 50;

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

// Function to invalidate cache
export async function invalidateStatsCache(userId: string) {
  const cacheKey = `dashboard:stats:${userId}`;
  await redis.del(cacheKey);
}

async function fetchAndCacheStats(userId: string, forceRefresh = false) {
  const cacheKey = `dashboard:stats:${userId}`;
  
  // Try to get cached data if not forcing refresh
  if (!forceRefresh) {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      subjects: true,
      favorites: true,
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Connect to Telegram
  const client = new TelegramClient(
    new StringSession(process.env.TELEGRAM_SESSION!),
    parseInt(process.env.TELEGRAM_API_ID!),
    process.env.TELEGRAM_API_HASH!,
    { connectionRetries: 5 }
  );

  await client.connect();

  try {
    let totalFiles = 0;
    let recentUploads: Array<{
      id: string;
      name: string;
      uploadedAt: string;
      subject: string;
    }> = [];
    const subjectStats: Record<string, number> = {};

    // Use Promise.all to fetch messages from all channels concurrently
    const channelPromises = Object.entries(CHANNEL_IDS).flatMap(([subject, channels]) => {
      subjectStats[subject] = 0;
      
      return Object.entries(channels).map(async ([type, channelId]) => {
        try {
          const messages = await client.getMessages(channelId, {
            limit: MESSAGES_LIMIT,
          });

          const files = messages.filter(msg => 
            msg?.media && ('document' in msg.media || 'photo' in msg.media)
          );

          totalFiles += files.length;
          subjectStats[subject] += files.length;

          return files.slice(0, 3).map(msg => {
            if (msg.media && ('document' in msg.media || 'photo' in msg.media)) {
              const uniqueId = `${subject}-${type}-${msg.id}`;
              let fileName = 'document' in msg.media 
                ? (msg.media.document as Api.Document).attributes.find(
                    (attr): attr is Api.DocumentAttributeFilename => 
                    attr.className === 'DocumentAttributeFilename'
                  )?.fileName || `file_${msg.id}`
                : `photo_${msg.id}.jpg`;

              return {
                id: uniqueId,
                name: fileName,
                uploadedAt: new Date(msg.date * 1000).toISOString(),
                subject: subject
              };
            }
            return null;
          }).filter(Boolean);
        } catch (error) {
          console.error(`Error fetching from channel ${channelId}:`, error);
          return [];
        }
      });
    });

    const filesArrays = await Promise.all(channelPromises);
    recentUploads = filesArrays.flat().filter(Boolean);

    // Sort and limit recent uploads
    const uniqueUploads = Array.from(
      new Map(recentUploads.map(item => [item.id, item])).values()
    ).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ).slice(0, 5);

    // Format subject stats
    const formattedSubjectStats = Object.entries(subjectStats)
      .map(([subject, fileCount]) => ({
        subject,
        fileCount
      }))
      .sort((a, b) => b.fileCount - a.fileCount);

    const stats = {
      totalFiles,
      totalDownloads: 0,
      favoriteFiles: user.favorites.length,
      recentUploads: uniqueUploads,
      subjectStats: formattedSubjectStats,
      lastUpdated: new Date().toISOString()
    };

    // Cache the results
    await redis.set(cacheKey, stats, {
      ex: CACHE_TTL
    });

    return stats;
  } finally {
    await client.disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if force refresh is requested
    const searchParams = new URL(request.url).searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';

    const stats = await fetchAndCacheStats(userId, forceRefresh);
    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
} 