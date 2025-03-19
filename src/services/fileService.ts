
/**
 * File storage service using browser's localStorage
 * In a production app, this would be replaced with a proper backend service
 */

// Generate a unique ID for files
const generateFileId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Check file size
export const checkFileSize = (file: File): { requiresCoin: boolean, size: number } => {
  const MAX_FREE_SIZE = 100 * 1024 * 1024; // 100MB
  return {
    requiresCoin: file.size > MAX_FREE_SIZE,
    size: file.size
  };
};

// Store file data
export const uploadFile = (file: File, userId?: string, forceFree = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileId = generateFileId();
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          reject(new Error('Failed to read file.'));
          return;
        }
        
        // Store file metadata
        const fileData = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          createdAt: new Date().toISOString(),
          userId: userId || null
        };
        
        // For large files, we only store the metadata and file ID
        // but not the actual file content in localStorage
        const { requiresCoin } = checkFileSize(file);
        
        if (requiresCoin && !forceFree) {
          // For coin-purchased files, we just store the metadata
          // In a real app, this would upload to a storage service
          localStorage.setItem(`file_${fileId}`, JSON.stringify({
            ...fileData,
            // We include a truncated version of the data just for demo purposes
            data: event.target.result.substring(0, 1000) + '...[content truncated for large file]',
            isPremium: true
          }));
          resolve(fileId);
        } else {
          // For smaller files, store complete data in localStorage
          try {
            localStorage.setItem(`file_${fileId}`, JSON.stringify({
              ...fileData,
              data: event.target.result
            }));
            resolve(fileId);
          } catch (e) {
            if (e instanceof DOMException && e.code === 22) {
              // localStorage quota exceeded
              reject(new Error('The file is too large to store. Please try a smaller file.'));
            } else {
              reject(new Error('Failed to store file.'));
            }
          }
        }
      } catch (error) {
        reject(new Error('Failed to process file.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
    
    // Read the file as Data URL
    reader.readAsDataURL(file);
  });
};

// Get file data by ID
export const getFileById = (fileId: string): any | null => {
  try {
    const fileDataString = localStorage.getItem(`file_${fileId}`);
    if (!fileDataString) return null;
    
    return JSON.parse(fileDataString);
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
};

// Create a download URL for a file
export const createDownloadLink = (fileId: string): string => {
  return `${window.location.origin}/download/${fileId}`;
};

// Helper to download a file
export const downloadFile = (fileData: any): void => {
  const linkElement = document.createElement('a');
  linkElement.href = fileData.data;
  linkElement.download = fileData.name;
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
};
