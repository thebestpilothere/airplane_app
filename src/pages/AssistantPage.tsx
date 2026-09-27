import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getChatThreads,
  createChatThread,
  deleteChatThread,
  getChatMessages,
  sendChatMessage,
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Sparkles, Send, Plus, Trash2, Bot, User, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const QUICK_PROMPTS = [
  'Which airlines are in my collection?',
  'How many Airbus vs Boeing do I have?',
  'What aircraft am I currently missing?',
  'Recommend what I should spot next',
];

export function AssistantPage() {
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-welcome');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], refetch: refetchThreads } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getChatThreads,
  });

  useEffect(() => {
    if (threads.length > 0 && !threads.find((t) => t.id === activeThreadId)) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (activeThreadId) {
      getChatMessages(activeThreadId).then((msgs) => setMessages(msgs));
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewThread = async () => {
    try {
      const id = await createChatThread('New conversation');
      await refetchThreads();
      setActiveThreadId(id);
      toast.success('Started new conversation');
    } catch {
      toast.error('Could not create thread');
    }
  };

  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) {
      toast.error('Cannot delete the only thread');
      return;
    }
    try {
      await deleteChatThread(id);
      await refetchThreads();
      if (activeThreadId === id) {
        const remaining = threads.filter((t) => t.id !== id);
        if (remaining.length) setActiveThreadId(remaining[0].id);
      }
    } catch {
      toast.error('Failed to delete thread');
    }
  };

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || input;
    if (!text.trim() || sending) return;

    setInput('');
    setSending(true);

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      thread_id: activeThreadId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const reply = await sendChatMessage(activeThreadId, text);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, reply]);
    } catch {
      toast.error('Assistant could not respond.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 animate-rise pb-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold sm:text-3xl font-display">AI Aviation Assistant</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask what you have, check airline stats, verify missing airframes, and plan your collection.
          </p>
        </div>

        <Button onClick={handleNewThread} variant="outline" size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New conversation
        </Button>
      </header>

      {/* Main Container: Threads sidebar + Chat window */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Threads sidebar */}
        <aside className="panel p-4 flex flex-col space-y-2 h-[650px] overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
            Conversations
          </p>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {threads.map((t) => {
              const active = t.id === activeThreadId;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-secondary text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                  {threads.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteThread(t.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 transition-opacity"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat message panel */}
        <main className="panel flex flex-col h-[650px] overflow-hidden p-0">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={cn('flex items-start gap-3', isAssistant ? 'justify-start' : 'justify-end')}
                >
                  {isAssistant && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm',
                      isAssistant
                        ? 'bg-surface-2 text-foreground border border-border'
                        : 'bg-horizon text-primary-foreground font-medium'
                    )}
                  >
                    {m.content}
                  </div>

                  {!isAssistant && (
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="panel px-4 py-2.5 text-xs text-muted-foreground bg-surface-2 animate-pulse">
                  Analyzing collection logbook…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt suggestions */}
          <div className="p-3 border-t border-border/50 bg-surface-2/30 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={sending}
                className="text-xs bg-surface hover:bg-surface-2 text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input container */}
          <div className="p-4 border-t border-border bg-surface flex items-end gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your collection (Press Enter to send)..."
              rows={2}
              className="resize-none min-h-[48px] max-h-32 text-sm"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="h-11 px-4 bg-horizon text-primary-foreground font-semibold"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
