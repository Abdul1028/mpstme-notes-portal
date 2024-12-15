class TelegramService {
  private async makeRequest(action: string, data: any) {
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to communicate with server');
    }
  }

  async createSubjectFolders(subjects: string[]) {
    if (!Array.isArray(subjects) || subjects.length === 0) {
      throw new Error('No subjects provided');
    }
    return this.makeRequest('createFolders', { subjects });
  }

  async uploadFile(channelId: number, file: File) {
    // Convert file to base64
    const base64 = await this.fileToBase64(file);
    
    return this.makeRequest('uploadFile', {
      channelId,
      file: base64,
      fileName: file.name,
      fileType: file.type,
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async getFiles(channelId: number) {
    return this.makeRequest('getFiles', { channelId });
  }
   
  async downloadFile(messageId: number, channelId: number) {
    return this.makeRequest('downloadFile', { messageId, channelId });
  }
}

export const telegramService = new TelegramService();

// Helper function for the onboarding page
export async function createSubjectFolders(subjects: string[]) {
  return telegramService.createSubjectFolders(subjects);
}
