'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore, useChatStore, useUIStore } from '@/store';
import { Chat, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { authService } from '@/services/auth.service';
import { chatService } from '@/services/chat.service';
import { formatMessageTime, cn } from '@/lib/utils';
import { useDebounce, useMediaQuery } from '@/hooks';
import {
  Search,
  MessageCircle,
  MoreVertical,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  PenLine,
  ChevronLeft,
  UserPlus,
} from 'lucide-react';
import { useTheme } from '@/providers/theme.provider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  const { user } = useAuthStore();
  const { chats, chatUsers, setSelectedChatId, selectedChatId, markChatRead } = useChatStore();
  const { searchQuery, setSearchQuery, isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const filteredChats = useMemo(() => {
    if (!debouncedSearch) return chats;
    const term = debouncedSearch.toLowerCase();
    return chats.filter((chat) => {
      const otherUid = chat.participants.find((p) => p !== user?.uid);
      const otherUser = otherUid ? chatUsers[otherUid] : null;
      return (
        otherUser?.name?.toLowerCase().includes(term) ||
        chat.lastMessage?.text?.toLowerCase().includes(term)
      );
    });
  }, [chats, debouncedSearch, user?.uid, chatUsers]);

  const handleSearchUsers = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const results = await chatService.searchUsers(term);
      setSearchResults(results.filter((u) => u.uid !== user?.uid));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [user?.uid]);

  const handleStartChat = useCallback(async (otherUserId: string) => {
    if (!user) return;
    try {
      const chatId = await chatService.createChat([user.uid, otherUserId]);
      setSelectedChatId(chatId);
      setSearchQuery('');
      setSearchResults([]);
      if (isMobile) setMobileSidebarOpen(false);
      router.push(`/chat/${chatId}`);
    } catch {
      toast.error('Failed to start chat');
    }
  }, [user, setSelectedChatId, setSearchQuery, isMobile, setMobileSidebarOpen, router]);

  const handleChatSelect = useCallback((chat: Chat) => {
    setSelectedChatId(chat.id);
    if (user) markChatRead(chat.id, user.uid);
    if (isMobile) setMobileSidebarOpen(false);
    router.push(`/chat/${chat.id}`);
  }, [setSelectedChatId, user, markChatRead, isMobile, setMobileSidebarOpen, router]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      router.replace('/login');
    } catch {
      toast.error('Logout failed');
    }
  }, [router]);

  const getOtherUser = (chat: Chat): User | null => {
    if (!user) return null;
    const otherUid = chat.participants.find((p) => p !== user.uid);
    return otherUid ? chatUsers[otherUid] || null : null;
  };

  const getUnreadCount = (chat: Chat): number => {
    if (!user) return 0;
    return chat.unreadCount?.[user.uid] || 0;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <button onClick={() => setShowProfile(!showProfile)}>
            <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-emerald-500/20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
          <div>
            <p className="font-semibold text-sm leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
          >
            <div className="p-4 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-emerald-500/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.bio && <p className="text-sm mt-2 text-muted-foreground">{user.bio}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearchUsers(e.target.value);
            }}
            className="pl-10 bg-muted/50 border-0"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border-b">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Users
            </p>
          </div>
          {searchResults.map((searchUser) => (
            <motion.button
              key={searchUser.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleStartChat(searchUser.uid)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={searchUser.avatar} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  {searchUser.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{searchUser.name}</p>
                <p className="text-xs text-muted-foreground">{searchUser.email}</p>
              </div>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Chats */}
      <div className="flex-1 overflow-hidden">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chats
          </p>
        </div>
        <ScrollArea className="h-full">
          <AnimatePresence>
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No chats found' : 'No chats yet'}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Search for users to start a conversation
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const otherUser = getOtherUser(chat);
                const unread = getUnreadCount(chat);
                return (
                  <motion.button
                    key={chat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleChatSelect(chat)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 transition-colors relative',
                      selectedChatId === chat.id
                        ? 'bg-muted/80'
                        : 'hover:bg-muted/40'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                          otherUser?.online ? 'bg-emerald-500' : 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate">
                          {otherUser?.name || 'Unknown User'}
                        </p>
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {formatMessageTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {chat.lastMessage?.text || 'Start a conversation'}
                        </p>
                        {unread > 0 && (
                          <Badge className="h-5 min-w-5 rounded-full bg-emerald-500 hover:bg-emerald-500 text-white text-xs flex items-center justify-center shrink-0">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 w-full max-w-sm"
          >
            <div className="absolute inset-0 bg-background">{sidebarContent}</div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full max-w-[360px] shrink-0 hidden md:block">
      {sidebarContent}
    </div>
  );
}
