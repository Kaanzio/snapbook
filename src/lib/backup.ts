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

  // Get correct extension from mime type
  let ext = 'jpg';
  if (blob.type === 'image/png') ext = 'png';
  else if (blob.type === 'image/gif') ext = 'gif';
  else if (blob.type === 'image/webp') ext = 'webp';

  const filename = `snapbook-${id.slice(0, 8)}.${ext}`;

  // If we are on a mobile device and the user might want the share sheet (which has "Save Image")
  // we could use share, but the user specifically asked for a direct download.
  // So we use the anchor tag method which is the standard "Download" behavior.
  
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (err) {
    console.error('Download failed, trying share as fallback', err);
    
    // Fallback to Share API if download fails (some mobile browsers block it)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Snapbook Fotoğraf',
            text: note || '',
          });
          return true;
        }
      } catch (shareErr) {
        console.error('Share fallback also failed', shareErr);
      }
    }
  }
  return false;
}
