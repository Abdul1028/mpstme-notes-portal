const isClient = typeof window !== 'undefined';

type SubjectChannel = {
  subject: string;
  mainChannelId: number;
  subChannels: {
    name: string;
    id: number;
    inviteLink: string;
  }[];
};

class ChannelStore {
  private static instance: ChannelStore;
  private channels: Map<string, SubjectChannel> = new Map();
  private readonly STORAGE_KEY = 'mpstme-channels';

  private constructor() {
    // Load channels from localStorage on initialization
    this.loadFromStorage();
    console.log('ChannelStore initialized with channels:', this.getAllSubjects()); // Debug log
  }

  static getInstance(): ChannelStore {
    if (!ChannelStore.instance) {
      ChannelStore.instance = new ChannelStore();
    }
    return ChannelStore.instance;
  }

  private loadFromStorage() {
    if (!isClient) return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const channels = JSON.parse(stored) as SubjectChannel[];
        this.channels = new Map(channels.map(channel => [channel.subject, channel]));
      }
    } catch (error) {
      console.error('Error loading channels from storage:', error);
    }
  }

  private saveToStorage() {
    if (!isClient) return;
    
    try {
      const channels = Array.from(this.channels.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(channels));
    } catch (error) {
      console.error('Error saving channels to storage:', error);
    }
  }

  setChannels(channels: SubjectChannel[]) {
    console.log('Setting channels:', channels); // Debug log
    channels.forEach(channel => {
      this.channels.set(channel.subject, channel);
    });
    this.saveToStorage();
    console.log('Channels after setting:', this.getAllSubjects()); // Debug log
  }

  getChannelId(subject: string, type: 'Lectures' | 'Assignments' | 'Study Materials'): number | null {
    const channel = this.channels.get(subject);
    if (!channel) return null;

    const subChannel = channel.subChannels.find(sc => sc.name.includes(type));
    return subChannel?.id || null;
  }

  getMainChannelId(subject: string): number | null {
    return this.channels.get(subject)?.mainChannelId || null;
  }

  getAllSubjects(): string[] {
    return Array.from(this.channels.keys());
  }

  // Debug method
  logChannels() {
    console.log('Current channels:', Array.from(this.channels.entries()));
  }

  clearStore() {
    this.channels.clear();
    if (isClient) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    console.log('Store cleared'); // Debug log
  }
}

export const channelStore = ChannelStore.getInstance(); 