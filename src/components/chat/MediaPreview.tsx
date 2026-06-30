'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface MediaPreviewProps {
  file: File;
  preview: string;
  onClear: () => void;
}

export function MediaPreview({ file, preview, onClear }: MediaPreviewProps) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-black/5 dark:border-white/5">
      <div className="relative inline-block">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm z-10"
        >
          <X className="h-3 w-3" />
        </Button>
        {isImage ? (
          <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
        ) : isVideo ? (
          <video src={preview} className="h-20 w-20 object-cover rounded-lg" />
        ) : (
          <div className="h-20 w-20 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-xs text-center px-2 truncate">{file.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
