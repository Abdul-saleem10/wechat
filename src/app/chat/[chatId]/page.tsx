'use client';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { use } from 'react';

export default function ChatIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);

  return <ChatPanel chatId={chatId} />;
}
