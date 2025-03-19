
import React, { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileLinkProps {
  fileUrl: string;
  className?: string;
}

const FileLink: React.FC<FileLinkProps> = ({ fileUrl, className }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <div className="p-4 rounded-lg glass-panel animate-slide-up">
        <p className="mb-2 text-sm font-medium text-gray-700">Share this link:</p>
        <div className="flex items-center">
          <div className="flex-1 mr-2 p-3 bg-gray-50 border border-gray-200 rounded-l-lg overflow-hidden">
            <div className="flex items-center">
              <LinkIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <p className="truncate text-sm text-gray-700">{fileUrl}</p>
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            className={cn(
              "p-3 rounded-r-lg subtle-transition flex items-center justify-center",
              copied
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileLink;
