const isClient = typeof window !== 'undefined';

export type SubjectChannel = {
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
    if (isClient) {
      // Listen for storage changes from other tabs/windows
      window.addEventListener('storage', (e) => {
        if (e.key === this.STORAGE_KEY) {
          this.loadFromStorage();
          this.notifyUpdate();
        }
      });
    }
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
        console.log('Loading channels from storage:', stored);
        const channels = JSON.parse(stored) as SubjectChannel[];
        this.channels.clear(); // Clear existing channels first
        channels.forEach(channel => {
          const consistentChannel = this.ensureConsistentIds(channel);
          this.channels.set(channel.subject, consistentChannel);
        });
        console.log('Loaded channels:', this.getAllSubjects());
      } else {
        console.log('No channels found in storage');
        this.channels.clear();
      }
    } catch (error) {
      console.error('Error loading channels from storage:', error);
      this.channels.clear();
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
      console.log('Saving channels to storage:', channels);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(channels));
    } catch (error) {
      console.error('Error saving channels to storage:', error);
    }
  }

  private notifyUpdate() {
    if (isClient) {
      window.dispatchEvent(new Event('channelsUpdated'));
    }
  }

  addChannel(channel: SubjectChannel) {
    console.log('Adding channel:', channel);
    const consistentChannel = this.ensureConsistentIds(channel);
    this.channels.set(channel.subject, consistentChannel);
    this.saveToStorage();
    this.notifyUpdate();
    console.log('Channel added, current subjects:', this.getAllSubjects());
  }

  setChannels(channels: SubjectChannel[]) {
    console.log('Setting channels:', channels);
    // Clear existing channels before setting new ones
    this.channels.clear();
    channels.forEach(channel => {
      this.addChannel(channel);
    });
    // Force a storage event to notify other tabs
    if (isClient) {
      localStorage.setItem(this.STORAGE_KEY + '_temp', Date.now().toString());
      localStorage.removeItem(this.STORAGE_KEY + '_temp');
    }
  }

  hasSubject(subject: string): boolean {
    return this.channels.has(subject);
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
    console.log('Clearing channel store...');
    this.channels.clear();
    if (isClient) {
      localStorage.removeItem(this.STORAGE_KEY);
      this.notifyUpdate();
    }
    console.log('Store cleared');
  }
}

export const channelStore = ChannelStore.getInstance(); 