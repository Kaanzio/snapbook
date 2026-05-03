import { v4 as uuidv4 } from 'uuid';
import { UploadFormData, PhotoMetadata } from '@/types';
import { getDeviceName } from './device';
import { savePhoto, deleteLocalPhoto, createPhotoMetadata, updatePhotoMetadata, notifyDataChange } from './indexeddb';

export async function uploadPhoto(file: File, formData: UploadFormData): Promise<string> {
  const id = uuidv4();

  // 1. Save binary and thumbnail to IndexedDB
  await savePhoto(id, file);

  // 2. Save metadata to IndexedDB
  const metadata: PhotoMetadata = {
    id,
    category: formData.category,
    note: formData.note || null,
    tags: formData.tags,
    is_starred: formData.is_starred,
    collection_ids: formData.collection_ids,
    latitude: null, // GPS extraction could go here
    longitude: null,
    device_name: getDeviceName(),
    created_at: new Date(),
  };

  await createPhotoMetadata(metadata);
  
  // 3. Notify app to re-render
  notifyDataChange('photos');

  return id;
}

export async function deletePhoto(id: string): Promise<void> {
  // Delete from local binary store
  await deleteLocalPhoto(id);
  // Delete from metadata store
  const { deletePhotoMetadata } = await import('./indexeddb');
  await deletePhotoMetadata(id);
  
  notifyDataChange('photos');
}
