'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthStore, useChatStore, useUIStore } from '@/store';
import { Message, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/services/chat.service';
import { authService } from '@/services/auth.service';
import { storageService } from '@/services/storage.service';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatMessageTime, formatFileSize, cn, timestampToMillis } from '@/lib/utils';
import { useMediaQuery } from '@/hooks';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { MediaPreview } from '@/components/chat/MediaPreview';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import {
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  Info,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  File,
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ChatPanelProps {
  chatId: string;
}

export function ChatPanel({ chatId }: ChatPanelProps) {
  const { user } = useAuthStore();
  const { chats, messages, chatUsers, setMessages, setTypingUsers, updateChatLastMessage, updateChatUser } = useChatStore();
  const { isUploading, uploadProgress, setIsUploading, setUploadProgress } = useUIStore();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();

  const otherUser = useMemo(() => {
    if (!user) return null;
    const chat = chats.find((c) => c.id === chatId);
    const otherUid = chat?.participants.find((p) => p !== user.uid);
    return otherUid && chatUsers[otherUid] ? chatUsers[otherUid] : null;
  }, [chats, chatId, user, chatUsers]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = chatService.listenToMessages(chatId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [chatId, setMessages]);

  useEffect(() => {
    if (!chatId || !user) return;
    chatService.markAsRead(chatId, user.uid);
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId || !user) return;

    let cancelled = false;
    let unsubStatus: (() => void) | null = null;

    (async () => {
      const chat = chats.find((c) => c.id === chatId);
      let otherUid = chat?.participants.find((p) => p !== user.uid);

      if (!otherUid) {
        const chatSnap = await getDoc(doc(db, 'chats', chatId));
        if (!chatSnap.exists()) return;
        otherUid = (chatSnap.data().participants as string[]).find((p: string) => p !== user.uid);
      }
      if (!otherUid) return;

      if (!chatUsers[otherUid]) {
        const userData = await authService.getUserData(otherUid);
        if (userData) updateChatUser(otherUid, userData);
      }

      if (cancelled) return;
      unsubStatus = chatService.listenToUserStatus(otherUid, (online, lastSeen) => {
        updateChatUser(otherUid!, { online, lastSeen: lastSeen ?? undefined } as any);
      });
    })();

    return () => {
      cancelled = true;
      unsubStatus?.();
    };
  }, [chatId, user]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = chatService.listenToTyping(chatId, (users) => {
      setTypingUsers(users);
    });
    return () => unsub();
  }, [chatId, setTypingUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user || !chatId) return;
    const trimmed = text.trim();
    setText('');

    const newMessage: Omit<Message, 'id'> = {
      chatId,
      senderId: user.uid,
      text: trimmed,
      type: 'text',
      status: 'sending',
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    };

    try {
      await chatService.sendMessage(chatId, newMessage);
    } catch {
      toast.error('Failed to send message');
      setText(trimmed);
    }
  }, [text, user, chatId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = useCallback(() => {
    if (!chatId || !user) return;
    chatService.updateTypingStatus(chatId, user.uid, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      chatService.updateTypingStatus(chatId, user.uid, false);
    }, 3000);
  }, [chatId, user]);

  const handleFileSelect = useCallback(async (file: File, type: Message['type']) => {
    if (!user || !chatId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setShowAttach(false);

    try {
      let mediaUrl: string;
      if (type === 'image') mediaUrl = await storageService.uploadImage(file, setUploadProgress);
      else if (type === 'video') mediaUrl = await storageService.uploadVideo(file, setUploadProgress);
      else mediaUrl = await storageService.uploadDocument(file, setUploadProgress);

      const newMessage: Omit<Message, 'id'> = {
        chatId,
        senderId: user.uid,
        text: type === 'document' ? file.name : '',
        type,
        mediaUrl,
        mediaName: file.name,
        mediaSize: file.size,
        status: 'sent',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      };

      await chatService.sendMessage(chatId, newMessage);
      toast.success(`${type === 'image' ? 'Image' : type === 'video' ? 'Video' : 'File'} sent!`);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [user, chatId, setIsUploading, setUploadProgress]);

  const handleVoiceSend = useCallback(async (blob: Blob, duration: number) => {
    if (!user || !chatId) return;
    setIsUploading(true);
    try {
      const mediaUrl = await storageService.uploadVoice(blob);
      const newMessage: Omit<Message, 'id'> = {
        chatId,
        senderId: user.uid,
        text: '',
        type: 'voice',
        mediaUrl,
        duration,
        status: 'sent',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      };
      await chatService.sendMessage(chatId, newMessage);
    } catch {
      toast.error('Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  }, [user, chatId, setIsUploading]);

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Select a chat</h2>
          <p className="text-sm text-muted-foreground/60 mt-1">Choose from your existing conversations</p>
        </div>
      </div>
    );
  }

  const chat = chats.find((c) => c.id === chatId);
  const isGroup = chat?.isGroup;

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100 dark:bg-gray-950">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => router.push('/chat')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-9 w-9 ring-2 ring-gray-400/30">
            <AvatarImage src={isGroup ? chat?.groupAvatar : otherUser?.avatar} />
            <AvatarFallback className={cn(
              'text-sm',
              isGroup
                ? 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            )}>
              {(isGroup
                ? chat?.groupName?.charAt(0).toUpperCase()
                : otherUser?.name?.charAt(0).toUpperCase()
              ) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{isGroup ? chat?.groupName : (otherUser?.name || 'Loading...')}</p>
            <p className="text-xs text-muted-foreground">
              {isGroup
                ? `${chat?.participants.length} participants`
                : otherUser?.online
                  ? 'Online'
                  : otherUser?.lastSeen
                    ? `Last seen ${formatMessageTime(otherUser.lastSeen)}`
                    : 'Offline'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isGroup && (<>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Video className="h-5 w-5" />
            </Button>
          </>)}
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <ScrollArea className="h-full">
            <div className="px-4 py-3 space-y-1">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isOwn = msg.senderId === user?.uid;
                  const showAvatar = !isOwn && (
                    idx === 0 || messages[idx - 1]?.senderId !== msg.senderId
                  );
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        otherUserAvatar={otherUser?.avatar}
                        otherUserName={otherUser?.name}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Typing Indicator */}
      {useChatStore.getState().typingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-gray-700 dark:text-gray-400 italic">
          {otherUser?.name} is typing...
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800/30">
          <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading... {Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1 mt-1">
            <div
              className="bg-gray-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Media Preview */}
      {mediaFile && mediaPreview && (
        <MediaPreview
          file={mediaFile}
          preview={mediaPreview}
          onClear={() => { setMediaFile(null); setMediaPreview(null); }}
        />
      )}

      {/* Message Input */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmoji(!showEmoji)}
                className="h-8 w-8 text-muted-foreground shrink-0"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Textarea
                placeholder="Type a message"
                value={text}
                onChange={(e) => { setText(e.target.value); handleTyping(); }}
                onKeyDown={handleKeyDown}
                className="border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[20px] max-h-[100px] py-1.5 px-2 text-sm"
                rows={1}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttach(!showAttach)}
                className="h-8 w-8 text-muted-foreground shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>

            {/* Emoji Picker */}
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <EmojiPicker
                  onSelect={(emoji) => setText((t) => t + emoji)}
                  onClose={() => setShowEmoji(false)}
                />
              </div>
            )}

            {/* Attachment Menu */}
            {showAttach && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-2 grid grid-cols-4 gap-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-800/50">
                      <ImageIcon className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="text-xs">Photos</span>
                  </button>
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-800/50">
                      <Video className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="text-xs">Videos</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-800/50">
                      <File className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="text-xs">Files</span>
                  </button>
                  <VoiceRecorder onSend={handleVoiceSend} />
                </div>
              </div>
            )}
          </div>

          {text.trim() ? (
            <Button
              onClick={handleSend}
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-600 hover:bg-gray-700 shrink-0"
            >
              <Send className="h-5 w-5 text-white" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, 'video');
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, 'document');
          e.target.value = '';
        }}
      />
    </div>
  );
}
