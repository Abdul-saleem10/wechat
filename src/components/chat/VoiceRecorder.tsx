'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
}

export function VoiceRecorder({ onSend }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>(undefined);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onSend(blob, duration);
        stream.getTracks().forEach((t) => t.stop());
        setDuration(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      setIsRecording(false);
    }
  }, [onSend, duration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isRecording ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="flex items-center gap-2 p-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-2 h-2 rounded-full bg-gray-600"
          />
          <span className="text-sm font-medium text-gray-600">{formatDuration(duration)}</span>
          <button
            onClick={stopRecording}
            className="p-1.5 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            <Square className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <button
          onClick={startRecording}
          className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-800/50">
            <Mic className="h-5 w-5 text-gray-700" />
          </div>
          <span className="text-xs">Voice</span>
        </button>
      )}
    </AnimatePresence>
  );
}
