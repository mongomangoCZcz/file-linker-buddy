
import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, X, FileIcon, Check } from "lucide-react";

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelected: (file: File) => void;
  onClearFile: () => void;
  selectedFile: File | null;
  isUploading: boolean;
}

const FileUpload = ({
  className,
  onFileSelected,
  onClearFile,
  selectedFile,
  isUploading,
  ...props
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size cannot exceed 2GB");
      return;
    }
    onFileSelected(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-xl p-8 rounded-xl glass-panel subtle-transition",
        className
      )}
      {...props}
    >
      {!selectedFile ? (
        <div
          className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50/50 subtle-transition"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center pt-5 pb-6 animate-slide-up">
            <Upload className="w-12 h-12 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Maximum file size: 2GB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        <div className="p-4 rounded-lg animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileIcon className="flex-shrink-0 w-10 h-10 text-primary" />
              <div className="overflow-hidden">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="p-1 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 subtle-transition"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {isUploading ? (
            <div className="h-1 w-full bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }}></div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Check className="w-5 h-5 mr-1 text-green-500" />
              <span className="text-sm text-green-500">Ready to upload</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { FileUpload };
