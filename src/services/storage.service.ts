import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { generateId } from '@/lib/utils';

export const storageService = {
  async uploadFile(
    file: File,
    path: string = 'uploads',
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const ext = file.name.split('.').pop();
    const filename = `${generateId()}.${ext}`;
    const storageRef = ref(storage, `${path}/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  },

  async uploadImage(file: File, onProgress?: (p: number) => void): Promise<string> {
    return this.uploadFile(file, 'images', onProgress);
  },

  async uploadVideo(file: File, onProgress?: (p: number) => void): Promise<string> {
    return this.uploadFile(file, 'videos', onProgress);
  },

  async uploadDocument(file: File, onProgress?: (p: number) => void): Promise<string> {
    return this.uploadFile(file, 'documents', onProgress);
  },

  async uploadVoice(blob: Blob, onProgress?: (p: number) => void): Promise<string> {
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    return this.uploadFile(file, 'voice', onProgress);
  },
};
