import Peer, { DataConnection } from 'peerjs';
import * as idb from './indexeddb';

export type SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'completed' | 'error';

export interface SyncProgress {
  status: SyncStatus;
  message: string;
  progress: number; // 0 to 100
}

interface SyncPayload {
  type: 'HELLO' | 'REQUEST_SYNC' | 'ACCEPT_SYNC' | 'SYNC_DATA' | 'SYNC_COMPLETE';
  payload?: any;
}

export class SyncManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private onProgress: (progress: SyncProgress) => void;
  private onConnectionRequest: (peerId: string, accept: () => void, reject: () => void) => void;

  constructor(
    onProgress: (progress: SyncProgress) => void,
    onConnectionRequest: (peerId: string, accept: () => void, reject: () => void) => void
  ) {
    this.onProgress = onProgress;
    this.onConnectionRequest = onConnectionRequest;
  }

  public initialize(peerId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(peerId || '', {
        debug: 2,
      });

      this.peer.on('open', (id) => {
        this.updateProgress('disconnected', 'Cihaz kimliği oluşturuldu.', 0);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        // Incoming connection
        this.onConnectionRequest(conn.peer, 
          () => this.acceptConnection(conn),
          () => {
            conn.send({ type: 'REJECTED' });
            setTimeout(() => conn.close(), 500);
          }
        );
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        this.updateProgress('error', `Bağlantı hatası: ${err.message}`, 0);
        reject(err);
      });
    });
  }

  public connectToPeer(targetPeerId: string) {
    if (!this.peer) return;
    this.updateProgress('connecting', 'Karşı cihaza bağlanılıyor...', 10);
    
    const conn = this.peer.connect(targetPeerId, {
      reliable: true
    });

    conn.on('open', () => {
      this.connection = conn;
      this.setupConnectionListeners(conn);
      this.updateProgress('connected', 'Bağlantı sağlandı. Eşitleme isteği gönderiliyor...', 20);
      conn.send({ type: 'REQUEST_SYNC' } as SyncPayload);
    });

    conn.on('error', (err) => {
      this.updateProgress('error', `Bağlantı koptu: ${err.message}`, 0);
    });
  }

  private acceptConnection(conn: DataConnection) {
    this.connection = conn;
    this.setupConnectionListeners(conn);
    this.updateProgress('connected', 'Bağlantı kabul edildi. Veri bekleniyor...', 20);
    conn.send({ type: 'REQUEST_SYNC' } as SyncPayload); // Also request sync to start the flow
  }

  private setupConnectionListeners(conn: DataConnection) {
    conn.on('data', async (data: any) => {
      const message = data as SyncPayload;
      
      switch (message.type) {
        case 'REQUEST_SYNC':
          // Start syncing from our side first
          await this.sendSyncData();
          break;
        case 'SYNC_DATA':
          await this.receiveSyncData(message.payload);
          // If we received data, we should also send ours to make it two-way
          // But only if we haven't sent yet to avoid infinite loop
          // Simple flag to prevent loop:
          if (!(conn as any).hasSentData) {
            await this.sendSyncData();
          } else {
            conn.send({ type: 'SYNC_COMPLETE' } as SyncPayload);
            this.finishSync();
          }
          break;
        case 'SYNC_COMPLETE':
          this.finishSync();
          setTimeout(() => this.disconnect(), 2000);
          break;
      }
    });

    conn.on('close', () => {
      if (this.peer && !this.peer.destroyed) {
        this.updateProgress('disconnected', 'Bağlantı sonlandırıldı.', 0);
      }
    });
  }

  private finishSync() {
    this.updateProgress('completed', 'Eşitleme tamamlandı!', 100);
    idb.notifyDataChange('photos');
    idb.notifyDataChange('collections');
    idb.notifyDataChange('canvases');
    idb.notifyDataChange('watchlist');
    idb.notifyDataChange('categories');
  }

  private async sendSyncData() {
    if (!this.connection) return;
    this.updateProgress('syncing', 'Veriler toplanıyor...', 30);
    
    try {
      const meta = await idb.getAllPhotosMeta();
      const collections = await idb.getAllCollections();
      const canvases = await idb.getAllCanvases();
      const watchlist = await idb.getAllWatchItems();
      const customLists = await idb.getAllCustomLists();
      
      const photoIds = await idb.getAllLocalPhotoIds();
      const photos = [];
      let loadedPhotos = 0;
      
      for (const id of photoIds) {
        const blob = await idb.getPhoto(id);
        if (blob) {
          photos.push({ id, blob });
        }
        loadedPhotos++;
        this.updateProgress('syncing', `Fotoğraflar hazırlanıyor... (${loadedPhotos}/${photoIds.length})`, 30 + (loadedPhotos / photoIds.length) * 20);
      }

      const payload = {
        meta,
        collections,
        canvases,
        watchlist,
        customLists,
        photos
      };

      this.updateProgress('syncing', 'Veriler karşı cihaza gönderiliyor...', 60);
      this.connection.send({ type: 'SYNC_DATA', payload } as SyncPayload);
      (this.connection as any).hasSentData = true;

    } catch (err: any) {
      this.updateProgress('error', `Veri gönderme hatası: ${err.message}`, 0);
    }
  }

  private async receiveSyncData(payload: any) {
    this.updateProgress('syncing', 'Karşı cihazdan veriler alınıyor ve birleştiriliyor...', 70);
    try {
      if (payload.meta) {
        for (const item of payload.meta) {
          await idb.createPhotoMetadata(item);
        }
      }
      if (payload.collections) {
        for (const item of payload.collections) {
          await idb.createCollection(item);
        }
      }
      if (payload.canvases) {
        for (const item of payload.canvases) {
          await idb.saveCanvas(item);
        }
      }
      if (payload.watchlist) {
        for (const item of payload.watchlist) {
          await idb.createWatchItem(item);
        }
      }
      if (payload.customLists) {
        for (const item of payload.customLists) {
          await idb.createCustomList(item);
        }
      }
      if (payload.photos) {
        let processed = 0;
        for (const photo of payload.photos) {
          const exists = await idb.hasPhoto(photo.id);
          if (!exists) {
            await idb.savePhoto(photo.id, photo.blob);
          }
          processed++;
          this.updateProgress('syncing', `Fotoğraflar kaydediliyor... (${processed}/${payload.photos.length})`, 70 + (processed / payload.photos.length) * 20);
        }
      }
      this.updateProgress('syncing', 'Veriler birleştirildi.', 90);
    } catch (err: any) {
      this.updateProgress('error', `Veri alma hatası: ${err.message}`, 0);
    }
  }

  public disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.updateProgress('disconnected', 'Bağlantı kesildi.', 0);
  }

  private updateProgress(status: SyncStatus, message: string, progress: number) {
    this.onProgress({ status, message, progress });
  }
}
