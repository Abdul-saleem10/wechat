'use client';

import { useState } from 'react';
import { Message } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageTime, formatFileSize, cn } from '@/lib/utils';
import { Check, CheckCheck, File, Play, Image, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  otherUserAvatar?: string;
  otherUserName?: string;
}

export function MessageBubble({ message, isOwn, showAvatar, otherUserAvatar, otherUserName }: MessageBubbleProps) {
  const [showPreview, setShowPreview] = useState(false);

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-1">
            <button onClick={() => setShowPreview(true)} className="block">
              <img
                src={message.mediaUrl}
                alt="Image"
                className="max-w-[250px] max-h-[300px] rounded-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                loading="lazy"
              />
            </button>
            {message.text && <p className="text-sm px-1">{message.text}</p>}
            {showPreview && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setShowPreview(false)}
              >
                <button className="absolute top-4 right-4 text-white p-2" onClick={() => setShowPreview(false)}>
                  <X className="h-6 w-6" />
                </button>
                <img
                  src={message.mediaUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-1">
            <video
              src={message.mediaUrl}
              controls
              preload="metadata"
              className="max-w-[250px] max-h-[300px] rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
            {message.text && <p className="text-sm px-1">{message.text}</p>}
          </div>
        );

      case 'document':
        return (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-800/50">
              <File className="h-5 w-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{message.mediaName || 'Document'}</p>
              {message.mediaSize && (
                <p className="text-xs text-muted-foreground">{formatFileSize(message.mediaSize)}</p>
              )}
            </div>
          </a>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors">
              <Play className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-gray-600 rounded-full" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:00'}
            </span>
            <audio src={message.mediaUrl} preload="none" />
          </div>
        );

      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        );
    }
  };

  return (
    <div className={cn('flex gap-2 px-2 py-0.5', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && showAvatar ? (
        <Avatar className="h-8 w-8 mt-1 shrink-0 self-end">
          <AvatarImage src={otherUserAvatar} />
          <AvatarFallback className="text-xs">
            {otherUserName?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      ) : !isOwn ? (
        <div className="w-8 shrink-0" />
      ) : null}

      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className={cn(
          'max-w-[70%] px-3 py-2 rounded-lg shadow-sm',
          isOwn
            ? 'bg-gray-200 dark:bg-gray-700 rounded-tr-sm'
            : 'bg-white dark:bg-gray-800 rounded-tl-sm'
        )}
      >
        {isOwn && message.type === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>}
        {!isOwn && message.type === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>}
        {message.type !== 'text' && renderContent()}

        <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-muted-foreground/70">
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && (
            message.status === 'sending' ? (
              <Clock className="h-3 w-3 text-muted-foreground/50" />
            ) : message.status === 'sent' ? (
              <Check className="h-3 w-3 text-muted-foreground/50" />
            ) : message.status === 'delivered' ? (
              <CheckCheck className="h-3 w-3 text-muted-foreground/50" />
            ) : (
              <CheckCheck className="h-3 w-3 text-gray-600" />
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { Clock } from 'lucide-react';
