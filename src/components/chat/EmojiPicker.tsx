'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search } from 'lucide-react';

const EMOJI_CATEGORIES: Record<string, string> = {
  'Smileys & Emotion': '😀😃😄😁😅😂🤣☺️😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁😮😯😲😳🥺😢😭😤😡🤬💀☠️💩🤡👹👺👻👽👾🤖',
  'Gestures & Body': '💪👍👎👊✊🤛🤜👏🙌👐🤲🤝🙏✍️💅🤳💃🕺👀👁️👄👅👃👂🦶🦵💋',
  'Animals & Nature': '🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🦟🦗🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🐊',
  'Food & Drink': '🍏🍎🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶🫑🌽🥕🧄🧅🥔🍠🥐🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🫓🥪🥙🧆🌮🌯🫔🥗🥘🫕🥫🍝',
  'Travel & Places': '🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🚚🚛🚜🛴🚲🛵🏍🛺🚔🚍🚘🚖🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂✈️🛩🛫🛬🪂💺🚁🚟🚠🚡🛰🚀🛸',
  'Objects': '⌚️📱💻⌨️🖥🖨🖱🖲🕹🗜💽💾💿📀📼📷📸📹🎥📽🎞📞☎️📟📠📺📻🎙🎚🎛🧭⏱⏲⏰🕰⌛️📡🔋🔌💡🔦🕯🧯🛢💸💵💴💶💷🪙💰💳',
  'Symbols': '❤️🧡💛💚💙💜🖤🤍🤎💕💞💓💗💖💘💝💟🆚💯🔞♻️✅❌❎➕➖➗✖️ℹ️🔄🔙🔚🔛🔜🔝🛐♈️♉️♊️♋️♌️♍️♎️♏️♐️♑️♒️♓️⛎🔯',
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const term = search.toLowerCase();
    const results: Record<string, string[]> = {};
    for (const [cat, emojis] of Object.entries(EMOJI_CATEGORIES)) {
      const matched = [...emojis].filter((e) => e.toLowerCase().includes(term));
      if (matched.length > 0) results[cat] = matched;
    }
    return results;
  }, [search]);

  return (
    <div className="bg-white dark:bg-[#2a3942] rounded-xl shadow-2xl border w-[320px]">
      <div className="flex items-center justify-between p-2 border-b dark:border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-7 text-xs border-0 bg-muted/50"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 ml-1 shrink-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="h-[280px]">
        <div className="p-2">
          {filtered ? (
            Object.entries(filtered).map(([cat, emojis]) => (
              <div key={cat} className="mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">{cat}</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => { onSelect(emoji); onClose(); }}
                      className="aspect-square flex items-center justify-center text-lg hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
              <div key={cat} className="mb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 px-1">{cat}</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {[...emojis].slice(0, 32).map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => { onSelect(emoji); onClose(); }}
                      className="aspect-square flex items-center justify-center text-lg hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
