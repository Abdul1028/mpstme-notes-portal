import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { NewMessage } from "telegram/events";
import { InputPeerChannel, InputMessagesFilterDocument } from "telegram/tl/types";
import BigInt from "big-integer";

const apiId = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession("1BQANOTEuMTA4LjU2LjE0MgG7lm/xRaJoBUDnLDtue3vGhpsuAYeC2Hoy0GsLrh+l6oUJ/lFYPCeLL9yU1E6CSCOzd79VF6UbsCuas6NWWKzVMxj5tCavdwjqTSQscZU+7FlyzWKXypfZK+am2CXRgH7gv+CbuWVvhirasU5GL3OA+91+tXhsrMaZaVs1v153fBVo7osNeRTFJSoASaRV11kt8Xk3xIELrn/KN1bthUeg9zt8aoy8mpHJ5luCUl/mOWBjW5HYaLVtsj9SNfWyYCu2G7Tr0I9PtCiyoFJT7GBaag5mT6kuBOp0owfzJRzAJJiCkwi9V2b4fhkaU144/AuwiRwWOGxZkDaM9anmJA88nw==");

if (!apiId || !apiHash) {
  throw new Error("Telegram API credentials not found in environment variables");
}

let client: TelegramClient | null = null;

async function getClient() {
  if (!client) {
    client = new TelegramClient(stringSession, Number(apiId), apiHash, {
      connectionRetries: 5,
      useWSS: false,
      maxConcurrentDownloads: 10
    });
    await client.connect();
    console.log('New Telegram client created and connected');
  }

  if (!client.connected) {
    try {
      await client.connect();
      console.log('Reconnected existing client');
    } catch (error) {
      console.error('Failed to reconnect, creating new client:', error);
      client = new TelegramClient(stringSession, Number(apiId), apiHash, {
        connectionRetries: 5,
        useWSS: false,
        maxConcurrentDownloads: 10
      });
      await client.connect();
    }
  }

  return client;
}

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json();
    const client = await getClient();

    switch (action) {
      case 'createFolders': {
        const { subjects } = data;
        if (!Array.isArray(subjects)) {
          return NextResponse.json({ 
            error: 'Invalid subjects data',
            details: 'Subjects must be an array'
          }, { status: 400 });
        }

        const results = [];
        
        // Create main channel for the app if it doesn't exist
        const mainChannel = await getOrCreateMainChannel(client);
        
        for (const subject of subjects) {
          // Create subject channel
          const subjectChannel = await createChannel(client, subject, `Notes for ${subject}`);
          
          // Create subfolders as discussion groups
          const subFolders = ['Lectures', 'Assignments', 'Study Materials'];
          const subChannels = [];
          
          for (const subFolder of subFolders) {
            const subChannel = await createChannel(
              client,
              `${subject}-${subFolder}`,
              `${subject} - ${subFolder}`
            );
            subChannels.push(subChannel);
          }
          
          results.push({
            subject,
            mainChannelId: subjectChannel.id,
            subChannels: subChannels.map(c => ({ 
              name: c.title,
              id: c.id,
              inviteLink: c.inviteLink
            }))
          });
        }

        return NextResponse.json({ success: true, results });
      }

      case 'uploadFile': {
        const { channelId, file, fileName, fileType } = data;
        
        // Upload file to channel
        const result = await uploadFileToChannel(
          client,
          channelId,
          file,
          fileName,
          fileType
        );
        
        return NextResponse.json({ success: true, result });
      }

      case 'getFiles': {
        const { channelId } = data;
        console.log('Getting files for channel ID:', channelId);
        
        try {
          // Get all dialogs first
          const dialogs = await client.getDialogs({
            limit: 100
          });
          
          console.log('Available dialogs:', dialogs.map(d => ({
            id: d.id?.toString(),
            title: d.title,
            isChannel: d.isChannel,
            className: d.entity?.className
          })));

          // Try to get the entity directly first
          let entity;
          try {
            entity = await client.getEntity(channelId);
            console.log('Found entity directly:', entity);
          } catch (entityError) {
            console.error('Failed to get entity directly:', entityError);
            
            // If direct entity fetch fails, try to find in dialogs
            const channel = dialogs.find(d => {
              if (!d.id) return false;
              
              const dialogId = typeof d.id === 'bigint' ? Number(d.id) : 
                             typeof d.id === 'number' ? d.id : 
                             Number(d.id.toString());
              
              // Handle both positive and negative versions of the ID
              const targetId = Math.abs(Number(channelId));
              const currentId = Math.abs(dialogId);
              
              const matches = currentId === targetId;
              console.log('Comparing:', { dialogId, channelId, currentId, targetId, matches });
              return matches;
            });

            if (!channel || !channel.entity) {
              console.log('Channel not found in dialogs either');
              throw new Error(`Channel not found with ID ${channelId}`);
            }
            
            entity = channel.entity;
          }

          // Get messages with documents
          const filter = new Api.InputMessagesFilterDocument();
          console.log('Getting messages with filter...');
          
          try {
            // Get messages using the entity
            const messages = await client.getMessages(entity, {
              limit: 100,
              filter: filter
            });

            console.log('Found messages:', messages.length);
            
            const files = messages
              .filter(msg => msg.media && 'document' in msg.media)
              .map(msg => {
                try {
                  const media = msg.media;
                  const document = media && 'document' in media ? media.document : null;
                  
                  if (!document) {
                    console.log('No document found in message:', msg.id);
                    return null;
                  }

                  // Get file name from document attributes
                  let fileName = 'Unnamed file';
                  let fileSize = 'Unknown size';
                  
                  if (document.attributes) {
                    for (const attr of document.attributes) {
                      if ('fileName' in attr) {
                        fileName = attr.fileName;
                      }
                    }
                  }

                  // Get file size
                  if ('size' in document) {
                    fileSize = Math.round(document.size / 1024) + ' KB';
                  }

                  // Get mime type
                  const mimeType = 'mimeType' in document ? document.mimeType : 'Unknown type';
                  
                  const uploadDate = new Date(msg.date * 1000).toLocaleString();
                  
                  const file = {
                    id: msg.id,
                    fileName,
                    size: fileSize,
                    uploadDate,
                    mimeType,
                    message: msg.message || ''
                  };
                  
                  console.log('Processed file:', file);
                  return file;
                } catch (fileError) {
                  console.error('Error processing file:', fileError);
                  return null;
                }
              })
              .filter(Boolean);

            console.log('Returning files:', files.length);
            
            return NextResponse.json({
              success: true,
              channelTitle: entity.title || 'Unknown Channel',
              files
            });
          } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
          }
        } catch (error) {
          console.error('Error in getFiles:', error);
          throw error;
        }
      }

      case 'downloadFile': {
        const { messageId, channelId } = data;
        const message = await client.getMessages(channelId, { ids: messageId });
        
        if (!message[0]?.media) {
          throw new Error('File not found');
        }

        const buffer = await client.downloadMedia(message[0].media);
        
        return NextResponse.json({
          success: true,
          file: buffer.toString('base64'),
          fileName: message[0].media.document?.fileName,
          mimeType: message[0].media.document?.mimeType
        });
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          details: `Action "${action}" not supported`
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Telegram API Error:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Telegram API Error',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: String(error)
    }, { status: 500 });
  }
}

async function getOrCreateMainChannel(client: TelegramClient) {
  try {
    // Try to find existing main channel
    const dialogs = await client.getDialogs({});
    const mainChannel = dialogs.find(d => d.title === "MPSTME Notes");
    
    if (mainChannel) {
      return mainChannel;
    }

    // Create new main channel
    return await createChannel(client, "MPSTME Notes", "Main channel for MPSTME Notes App");
  } catch (error) {
    console.error("Error in getOrCreateMainChannel:", error);
    throw error;
  }
}

async function createChannel(client: TelegramClient, title: string, about: string) {
  try {
    console.log(`Creating channel: ${title}`);
    const result = await client.invoke(new Api.channels.CreateChannel({
      title,
      about,
      megagroup: true,
      broadcast: false
    }));

    // Get the created channel from updates
    const channel = result.chats?.find(chat => 
      chat.className === 'Channel' && chat.title === title
    );
    
    if (!channel) {
      throw new Error('Failed to create channel');
    }

    console.log('Channel created:', channel);
    
    // Generate an invite link
    const inviteResult = await client.invoke(new Api.messages.ExportChatInvite({
      peer: channel,
      title: "Join Channel",
    }));

    const inviteLink = inviteResult.className === 'ChatInviteExported' ? inviteResult.link : '';
    console.log('Invite link created:', inviteLink);

    return {
      id: channel.id,
      title: channel.title,
      inviteLink
    };
  } catch (error) {
    console.error("Error in createChannel:", error);
    throw new Error(`Failed to create channel "${title}": ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function uploadFileToChannel(
  client: TelegramClient,
  channelId: number,
  fileData: string,
  fileName: string,
  fileType: string
) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(fileData.split(',')[1], 'base64');
    
    // Get all dialogs (channels, chats, etc.)
    const dialogs = await client.getDialogs({});
    console.log("Available channels:", dialogs.map(d => ({ 
      id: d.id?.toString(), 
      title: d.title,
      isChannel: d.isChannel
    })));
    
    // Try to get the channel directly
    try {
      const entity = await client.getEntity(channelId);
      console.log("Found entity directly:", entity);
      
      // Upload file to Telegram
      const result = await client.sendFile(entity, {
        file: buffer,
        workers: 1,
        caption: `File: ${fileName}\nType: ${fileType}`,
        attributes: [
          new Api.DocumentAttributeFilename({
            fileName: fileName
          })
        ]
      });

      return {
        messageId: result.id,
        fileName,
        fileType,
        date: result.date,
      };
    } catch (entityError) {
      console.log("Failed to get entity directly, trying alternative methods...");
      
      // Try to find the channel in dialogs
      const channel = dialogs.find(d => {
        const dialogId = typeof d.id === 'number' ? d.id : Number(d.id?.toString());
        return dialogId === channelId || dialogId === -channelId;
      });
      
      if (!channel) {
        console.log("Available channel IDs:", dialogs.map(d => d.id?.toString()));
        throw new Error(`Channel not found with ID ${channelId}. Available channels: ${dialogs.map(d => `${d.title} (${d.id})`).join(', ')}`);
      }
      
      console.log("Found channel in dialogs:", { id: channel.id, title: channel.title });
      
      // Upload file using the found channel
      const result = await client.sendFile(channel.inputEntity, {
        file: buffer,
        workers: 1,
        caption: `File: ${fileName}\nType: ${fileType}`,
        attributes: [
          new Api.DocumentAttributeFilename({
            fileName: fileName
          })
        ]
      });

      return {
        messageId: result.id,
        fileName,
        fileType,
        date: result.date,
      };
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
  }
}