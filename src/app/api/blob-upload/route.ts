import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname: string) => {
                return {
                    allowedContentTypes: [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    ],
                    maximumSizeInBytes: 50 * 1024 * 1024, // Increased to 50MB
                };
            },
            onUploadCompleted: async ({ blob }) => {
                console.log('Upload completed:', blob);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error("Blob upload error:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
} 