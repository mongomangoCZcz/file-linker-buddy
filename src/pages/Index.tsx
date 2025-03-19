
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileUpload } from '@/components/ui/file-upload';
import FileLink from '@/components/file-link';
import { uploadFile, checkFileSize, createDownloadLink } from '@/services/fileService';
import { useCoin } from '@/services/coinService';
import { useAuth } from '@/context/AuthContext';
import UserProfile from '@/components/user-profile';
import { toast } from 'sonner';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [requiresCoin, setRequiresCoin] = useState(false);
  const [showContinueOption, setShowContinueOption] = useState(false);
  const { user } = useAuth();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileUrl(null); // Reset previous link
    setShowContinueOption(false);
    
    // Check if file requires a coin
    const { requiresCoin: needsCoin } = checkFileSize(file);
    setRequiresCoin(needsCoin);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileUrl(null);
    setRequiresCoin(false);
    setShowContinueOption(false);
  };

  const handleUpload = async (forceFree = false) => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      
      // Check file size
      const { requiresCoin: needsCoin, size } = checkFileSize(selectedFile);
      
      // If file needs a coin and user is logged in and not forcing free upload
      if (needsCoin && !forceFree) {
        if (!user) {
          toast.error('You need to be logged in to upload files larger than 100MB');
          return;
        }
        
        // Check if user has enough coins
        if (user.coins < 1) {
          setShowContinueOption(true);
          toast.error("Not enough coins. Add more coins or continue with limited functionality.");
          return;
        }
        
        // Use a coin
        const { success, updatedUser } = await useCoin(user.id);
        if (!success) {
          return; // The useCoin function will show appropriate error
        }
        
        // Update the local user state to show updated coin count immediately
        if (updatedUser) {
          useAuth().user.coins = updatedUser.coins;
        }
        
        toast.success('Used 1 coin for this large file upload');
      }
      
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fileId = await uploadFile(selectedFile, user?.id, forceFree);
      const downloadUrl = createDownloadLink(fileId);
      
      setFileUrl(downloadUrl);
      
      if (needsCoin && !forceFree) {
        toast.success('Large file uploaded successfully! (Premium upload)');
      } else if (needsCoin && forceFree) {
        toast.success('File uploaded with limited functionality');
      } else {
        toast.success('File uploaded successfully!');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload file');
      }
    } finally {
      setIsUploading(false);
      setShowContinueOption(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-3xl mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          FileShare
        </h1>
        <UserProfile />
      </div>
      
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

        {requiresCoin && (
          <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <div className="flex items-start">
              <Coins className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Large file detected</h3>
                <p className="text-sm mt-1">
                  Files larger than 100MB require 1 coin to upload. 
                  {user ? (
                    <>
                      {" You have "}
                      <span className="font-medium">{user.coins} {user.coins === 1 ? "coin" : "coins"}</span>
                      {user.coins === 0 ? (
                        <Link to="/store" className="block mt-2 text-primary hover:underline">
                          Purchase coins
                        </Link>
                      ) : null}
                    </>
                  ) : (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-primary">
                          Log in or register
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Sign in or create an account</SheetTitle>
                          <SheetDescription>
                            You need to be logged in to upload files larger than 100MB.
                            New accounts get 1 free coin!
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                          <Button asChild>
                            <Link to="/register">Create an account</Link>
                          </Button>
                          <Button asChild variant="outline">
                            <Link to="/login">Sign in</Link>
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {showContinueOption && (
          <div className="w-full p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 mb-3">
              You don't have enough coins for premium upload. You can still upload with limited functionality.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/store">Add coins</Link>
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleUpload(true)}
                disabled={isUploading}
              >
                Continue anyway
              </Button>
            </div>
          </div>
        )}

        {!fileUrl && !showContinueOption && (
          <button
            onClick={() => handleUpload(false)}
            disabled={!selectedFile || isUploading}
            className="px-8 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed subtle-transition"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        )}

        {fileUrl && <FileLink fileUrl={fileUrl} />}
      </div>
      
      <footer className="mt-auto pt-16 text-center text-sm text-gray-500">
        <p>Designed with simplicity in mind • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Index;
