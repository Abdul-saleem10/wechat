'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import { chatService } from '@/services/chat.service';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, X, Check, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface GroupCreateModalProps {
  onClose: () => void;
}

export function GroupCreateModal({ onClose }: GroupCreateModalProps) {
  const { user } = useAuthStore();
  const { updateChatUser } = useChatStore();
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    chatService.searchUsers(searchQuery).then((results) => {
      if (!cancelled) {
        setSearchResults(results.filter((u) => u.uid !== user?.uid));
      }
    }).catch(() => {
      if (!cancelled) setSearchResults([]);
    });
    return () => { cancelled = true; };
  }, [searchQuery, user?.uid]);

  const toggleUser = useCallback((u: User) => {
    setSelectedUsers((prev) =>
      prev.find((p) => p.uid === u.uid)
        ? prev.filter((p) => p.uid !== u.uid)
        : [...prev, u]
    );
  }, []);

  const handleCreate = useCallback(async () => {
    if (!user || selectedUsers.length < 1 || !groupName.trim()) return;
    setIsCreating(true);
    try {
      const allParticipants = [user.uid, ...selectedUsers.map((u) => u.uid)];
      const chatId = await chatService.createGroup(
        groupName.trim(),
        allParticipants,
        user.uid
      );

      selectedUsers.forEach((u) => updateChatUser(u.uid, u));
      updateChatUser(user.uid, user);

      toast.success(`Group "${groupName.trim()}" created!`);
      onClose();
      router.push(`/chat/${chatId}`);
    } catch {
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  }, [user, selectedUsers, groupName, updateChatUser, onClose, router]);

  const selectedCount = selectedUsers.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-lg">
              {step === 'select' ? 'Add Participants' : 'Group Name'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {step === 'select' ? (
          <>
            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0"
                  autoFocus
                />
              </div>
            </div>

            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {selectedUsers.map((u) => (
                  <span
                    key={u.uid}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 rounded-full text-xs font-medium"
                  >
                    {u.name}
                    <button onClick={() => toggleUser(u)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* User list */}
            <ScrollArea className="flex-1 max-h-[50vh]">
              {(searchResults.length > 0
                ? searchResults
                : selectedUsers
              ).map((u) => {
                const isSelected = !!selectedUsers.find((p) => p.uid === u.uid);
                if (!searchResults.length && !isSelected) return null;
                return (
                  <button
                    key={u.uid}
                    onClick={() => toggleUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {u.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-gray-600 border-gray-600 text-white'
                        : 'border-muted-foreground/40'
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}

              {searchResults.length === 0 && selectedUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Search for users to add</p>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t">
              <Button
                className="w-full"
                disabled={selectedUsers.length < 1}
                onClick={() => setStep('create')}
              >
                {selectedUsers.length < 1
                  ? 'Select at least 1 participant'
                  : `Next (${selectedUsers.length} selected)`
                }
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 flex flex-col items-center gap-4">
              {/* Selected users avatars */}
              <div className="flex -space-x-2">
                {selectedUsers.slice(0, 5).map((u) => (
                  <Avatar key={u.uid} className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-sm">
                      {u.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>

              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="text-center text-lg font-semibold border-0 border-b-2 rounded-none focus-visible:ring-0 px-0"
                autoFocus
              />
            </div>

            <div className="mt-auto p-3 border-t flex gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!groupName.trim() || isCreating}
                onClick={handleCreate}
              >
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</>
                ) : (
                  `Create Group (${selectedCount + 1})`
                )}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
