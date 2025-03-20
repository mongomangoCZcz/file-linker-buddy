
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
    
    // Set a timeout to prevent browser from hanging
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File processing timeout'));
    }, 30000); // 30 second timeout
    
    reader.onload = (event) => {
      clearTimeout(timeout);
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
        const { requiresCoin } = checkFileSize(file);
        
        try {
          if (requiresCoin && !forceFree) {
            // For coin-purchased files, store minimal data
            localStorage.setItem(`file_${fileId}`, JSON.stringify({
              ...fileData,
              isPremium: true,
              data: `data:${file.type};name=${encodeURIComponent(file.name)};size=${file.size}`
            }));
          } else {
            // For smaller files or free option
            const truncatedData = event.target.result.substring(0, 100000); // Limit to ~100KB
            localStorage.setItem(`file_${fileId}`, JSON.stringify({
              ...fileData,
              data: truncatedData + (truncatedData.length < event.target.result.length ? '...[content truncated]' : ''),
              isTruncated: truncatedData.length < event.target.result.length
            }));
          }
          resolve(fileId);
        } catch (e) {
          if (e instanceof DOMException && (e.code === 22 || e.name === 'QuotaExceededError')) {
            // localStorage quota exceeded - store minimal data
            localStorage.setItem(`file_${fileId}`, JSON.stringify({
              ...fileData,
              data: `data:${file.type};name=${encodeURIComponent(file.name)};size=${file.size}`,
              isTruncated: true,
              errorMessage: 'File content too large for browser storage'
            }));
            resolve(fileId);
          } else {
            reject(new Error('Failed to store file.'));
          }
        }
      } catch (error) {
        reject(new Error('Failed to process file.'));
      }
    };
    
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to read file.'));
    };
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        // Reset timeout on progress
        clearTimeout(timeout);
      }
    };
    
    // Read the file as Data URL with chunking to prevent memory issues
    const chunk = file.slice(0, 100000); // Only read first 100KB
    reader.readAsDataURL(chunk);
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
