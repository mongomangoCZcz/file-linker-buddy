
import React, { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import FileLink from '@/components/file-link';
import { uploadFile, createDownloadLink } from '@/services/fileService';
import { toast } from 'sonner';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileUrl(null); // Reset previous link
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fileId = await uploadFile(selectedFile);
      const downloadUrl = createDownloadLink(fileId);
      
      setFileUrl(downloadUrl);
      toast.success('File uploaded successfully!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center space-y-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 mb-2 text-xs font-medium text-primary bg-primary/10 rounded-full">
            Simple & Secure
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-3">
            FileShare
          </h1>
          <p className="max-w-md mx-auto text-lg text-gray-500">
            Upload your files and share them with a simple link.
          </p>
        </div>

        <FileUpload
          selectedFile={selectedFile}
          onFileSelected={handleFileSelect}
          onClearFile={handleClearFile}
          isUploading={isUploading}
        />

        {!fileUrl && (
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-8 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed subtle-transition"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        )}

        {fileUrl && <FileLink fileUrl={fileUrl} />}
      </div>
      
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>Designed with simplicity in mind • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Index;
