
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFileById, downloadFile } from '@/services/fileService';
import { ArrowLeft, Download, FileIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const Download = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setError('No file ID provided');
      setLoading(false);
      return;
    }

    try {
      const data = getFileById(fileId);
      if (!data) {
        setError('File not found or has expired');
      } else {
        setFileData(data);
      }
    } catch (err) {
      setError('Error retrieving file');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  const handleDownload = () => {
    if (!fileData) return;
    
    try {
      downloadFile(fileData);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-fade-in">
        <Link to="/" className="self-start mb-8 flex items-center text-gray-600 hover:text-gray-900 subtle-transition">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Back to upload</span>
        </Link>

        <div className="w-full p-8 rounded-xl glass-panel">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading file...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">File Unavailable</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <Link
                to="/"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 subtle-transition"
              >
                Upload a New File
              </Link>
            </div>
          ) : (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ready to Download</h2>
                <p className="text-gray-500">Your file is ready to be downloaded</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-6">
                  <FileIcon className="w-12 h-12 text-primary mr-4" />
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-gray-900 truncate">{fileData.name}</h3>
                    <div className="flex flex-wrap text-sm text-gray-500 mt-1">
                      <span className="mr-4">{formatFileSize(fileData.size)}</span>
                      <span>Uploaded on {formatDate(fileData.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 subtle-transition"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>Designed with simplicity in mind • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Download;
