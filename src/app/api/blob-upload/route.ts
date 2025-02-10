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
                        // Documents
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'text/plain',
                        'application/rtf',
                        
                        // Images
                        'image/jpeg',
                        'image/jpg',
                        'image/png',
                        'image/gif',
                        'image/webp',
                        'image/svg+xml',
                        'image/bmp',
                        'image/tiff',
                        
                        // Videos
                        'video/mp4',
                        'video/webm',
                        'video/quicktime',
                        'video/x-msvideo',
                        'video/x-matroska',
                        'video/3gpp',
                        
                        // Audio
                        'audio/mpeg',
                        'audio/wav',
                        'audio/ogg',
                        'audio/midi',
                        'audio/x-midi',
                        'audio/aac',
                        'audio/flac',
                        
                        // Archives
                        'application/zip',
                        'application/x-rar-compressed',
                        'application/x-7z-compressed',
                        'application/gzip',
                        'application/x-tar',
                        
                        // Programming
                        'text/javascript',
                        'application/javascript',
                        'text/x-python',
                        'text/x-java',
                        'text/x-c',
                        'text/x-cpp',
                        'text/x-ruby',
                        'text/x-php',
                        'text/x-typescript',
                        'text/typescript',
                        'text/x-go',
                        'text/x-rust',
                        'text/x-swift',
                        'text/x-kotlin',
                        'text/x-scala',
                        
                        // Web
                        'application/json',
                        'text/html',
                        'text/css',
                        'text/xml',
                        'application/xml',
                        'text/markdown',
                        'text/yaml',
                        'text/csv',
                        
                        // Others
                        'application/octet-stream',
                        'text/x-log',
                        'application/x-httpd-php',
                        'application/x-sh',
                        'application/x-bash',
                    ],
                    maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
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