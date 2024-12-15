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
  readonly STORAGE_KEY = 'mpstme-channels';

  private constructor() {
    this.loadFromStorage();
    console.log('ChannelStore initialized with channels:', this.getAllSubjects());
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
        channels.forEach(channel => {
          channel.mainChannelId = this.ensureNegativeId(channel.mainChannelId);
          channel.subChannels.forEach(sc => {
            sc.id = this.ensureNegativeId(sc.id);
          });
        });
        this.channels = new Map(channels.map(channel => [channel.subject, channel]));
      }
    } catch (error) {
      console.error('Error loading channels from storage:', error);
    }
  }

  private ensureNegativeId(id: number): number {
    return -Math.abs(id);
  }

  private ensureConsistentIds(channel: SubjectChannel): SubjectChannel {
    return {
      ...channel,
      mainChannelId: this.ensureNegativeId(channel.mainChannelId),
      subChannels: channel.subChannels.map(sc => ({
        ...sc,
        id: this.ensureNegativeId(sc.id)
      }))
    };
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
    console.log('Setting channels:', channels);
    channels.forEach(channel => {
      const consistentChannel = this.ensureConsistentIds(channel);
      this.channels.set(channel.subject, consistentChannel);
    });
    this.saveToStorage();
    console.log('Channels after setting:', this.getAllSubjects());
  }

  getChannelId(subject: string, type: 'Lectures' | 'Assignments' | 'Study Materials'): number | null {
    const channel = this.channels.get(subject);
    if (!channel) {
      console.log(`No channel found for subject: ${subject}`);
      return null;
    }

    const subChannel = channel.subChannels.find(sc => sc.name.includes(type));
    if (!subChannel) {
      console.log(`No subchannel found for type: ${type} in subject: ${subject}`);
      return null;
    }

    return this.ensureNegativeId(subChannel.id);
  }

  getMainChannelId(subject: string): number | null {
    const channel = this.channels.get(subject);
    if (!channel) return null;
    return this.ensureNegativeId(channel.mainChannelId);
  }

  getAllSubjects(): string[] {
    return Array.from(this.channels.keys());
  }

  logChannels() {
    console.log('Current channels:', Array.from(this.channels.entries()));
  }

  clearStore() {
    this.channels.clear();
    if (isClient) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    console.log('Store cleared');
  }
}

export const channelStore = ChannelStore.getInstance(); 