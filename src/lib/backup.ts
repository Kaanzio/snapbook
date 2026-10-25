import JSZip from 'jszip';
import { 
  getAllPhotosMeta, 
  getPhoto, 
  savePhoto,
  getAllCollections, 
  getAllCanvases,
  getPreferences,
  getCustomCategories,
  getAllLocalPhotoIds,
  createPhotoMetadata,
  createCollection,
  saveCanvas,
  savePreferences,
  saveCustomCategory,
  notifyDataChange
} from './indexeddb';

export async function exportAllData() {
  const zip = new JSZip();
  
  // 1. Get all text/metadata
  const photos = await getAllPhotosMeta();
  const collections = await getAllCollections();
  const canvases = await getAllCanvases();
  const preferences = await getPreferences();
  const categories = await getCustomCategories();
  
  // 2. Create data.json with all non-binary data
  const backupData = {
    exportDate: new Date().toISOString(),
    version: '1.2',
    photos,
    collections,
    canvases,
    preferences,
    categories
  };
  
  zip.file('data.json', JSON.stringify(backupData, null, 2));
  
  // 3. Add photos
  const photosFolder = zip.folder('photos');
  if (photosFolder) {
    const allPhotoIds = await getAllLocalPhotoIds();
    for (const id of allPhotoIds) {
      const blob = await getPhoto(id);
      if (blob) {
        let ext = 'jpg';
        if (blob.type === 'image/png') ext = 'png';
        else if (blob.type === 'image/gif') ext = 'gif';
        else if (blob.type === 'image/webp') ext = 'webp';
        
        const filename = `${id}.${ext}`;
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

export async function importAllData(file: File, onProgress?: (progress: number) => void): Promise<void> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const dataFile = loadedZip.file('data.json');
  if (!dataFile) {
    throw new Error('Geçersiz veya bozuk yedek dosyası: data.json bulunamadı.');
  }

  const dataStr = await dataFile.async('string');
  const data = JSON.parse(dataStr);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restoreDates = (obj: any) => {
    if (!obj) return obj;
    if (obj.created_at) obj.created_at = new Date(obj.created_at);
    if (obj.updated_at) obj.updated_at = new Date(obj.updated_at);
    return obj;
  };

  // Restore Metadata & Text
  if (data.photos && Array.isArray(data.photos)) {
    for (const item of data.photos) await createPhotoMetadata(restoreDates(item));
  }
  if (data.collections && Array.isArray(data.collections)) {
    for (const item of data.collections) await createCollection(restoreDates(item));
  }
  if (data.canvases && Array.isArray(data.canvases)) {
    for (const item of data.canvases) await saveCanvas(restoreDates(item));
  }
  if (data.preferences) {
    await savePreferences(data.preferences);
  }
  if (data.categories && Array.isArray(data.categories)) {
    for (const item of data.categories) await saveCustomCategory(item);
  }

  // Restore Photos
  const photoFolder = loadedZip.folder('photos');
  if (photoFolder) {
    const filesToProcess: { relativePath: string; file: JSZip.JSZipObject }[] = [];
    
    photoFolder.forEach((relativePath, file) => {
      if (!file.dir) filesToProcess.push({ relativePath, file });
    });

    let count = 0;
    for (const { relativePath, file } of filesToProcess) {
      const id = relativePath.split('.')[0];
      
      const arrayBuffer = await file.async('arraybuffer');
      let mimeType = 'image/jpeg';
      if (relativePath.endsWith('.png')) mimeType = 'image/png';
      else if (relativePath.endsWith('.gif')) mimeType = 'image/gif';
      else if (relativePath.endsWith('.webp')) mimeType = 'image/webp';

      const blob = new Blob([arrayBuffer], { type: mimeType });
      
      // Save original file to IDB (savePhoto will automatically generate thumbnail)
      const fileObj = new File([blob], relativePath, { type: mimeType });
      await savePhoto(id, fileObj);
      
      count++;
      if (onProgress) {
        onProgress(Math.round((count / filesToProcess.length) * 100));
      }
    }
  }

  // Notify UI
  notifyDataChange('photos');
  notifyDataChange('collections');
  notifyDataChange('canvases');
  notifyDataChange('preferences');
  notifyDataChange('categories');
}

export async function savePhotoToDevice(id: string, note?: string | null): Promise<boolean> {
  const blob = await getPhoto(id);
  if (!blob) return false;

  let ext = 'jpg';
  if (blob.type === 'image/png') ext = 'png';
  else if (blob.type === 'image/gif') ext = 'gif';
  else if (blob.type === 'image/webp') ext = 'webp';

  const filename = `snapbook-${id.slice(0, 8)}.${ext}`;

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Error saving photo:', err);
    return false;
  }
}
