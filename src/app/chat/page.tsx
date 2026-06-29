'use client';

import { useAuthStore, useChatStore } from '@/store';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function ChatHomePage() {
  const { user } = useAuthStore();
  const { chatUsers } = useChatStore();

  if (!user) return null;

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <Card className="p-12 text-center max-w-md bg-background/50 backdrop-blur-sm border-0 shadow-none">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <MessageCircle className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">WeChat</h2>
        <p className="text-muted-foreground mb-6">
          Welcome, {user.name}! Select a chat from the sidebar to start messaging.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          {Object.keys(chatUsers).length} contacts online
        </div>
      </Card>
    </div>
  );
}
