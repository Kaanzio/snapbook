import JSZip from 'jszip';
import { getAllPhotosMeta, getPhoto, getAllCollections, getAllCanvases } from './indexeddb';

export async function exportAllData() {
  const zip = new JSZip();
  
  // 1. Get all metadata
  const photos = await getAllPhotosMeta();
  const collections = await getAllCollections();
  const canvases = await getAllCanvases();
  
  // 2. Create data.json with all non-binary data
  const backupData = {
    exportDate: new Date().toISOString(),
    photos,
    collections,
    canvases,
    version: '1.0'
  };
  
  zip.file('data.json', JSON.stringify(backupData, null, 2));
  
  // 3. Add photos
  const photosFolder = zip.folder('photos');
  if (photosFolder) {
    for (const photo of photos) {
      const blob = await getPhoto(photo.id);
      if (blob) {
        // Try to get extension from mime type
        let ext = 'jpg';
        if (blob.type === 'image/png') ext = 'png';
        else if (blob.type === 'image/gif') ext = 'gif';
        else if (blob.type === 'image/webp') ext = 'webp';
        
        const filename = `${photo.id}.${ext}`;
        photosFolder.file(filename, blob);
      }
    }
  }
  
  // 4. Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snapbook-backup-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function savePhotoToDevice(id: string, note?: string) {
  const blob = await getPhoto(id);
  if (!blob) return;
  
  // On mobile, try to use the Share API if available, as it allows "Save Image"
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'photo.jpg', { type: blob.type })] })) {
    try {
      const file = new File([blob], `snapbook-${id.slice(0, 8)}.jpg`, { type: blob.type });
      await navigator.share({
        files: [file],
        title: 'Snapbook Fotoğraf',
        text: note || '',
      });
      return true;
    } catch (err) {
      console.error('Share failed', err);
      // Fallback to download
    }
  }
  
  // Fallback: Direct download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `snapbook-${id.slice(0, 8)}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
