import { useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Message } from "../types";

interface Props {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${time}`;
  }

  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`;
}

export default function MessageList({ messages, loading, hasMore, onLoadMore }: Props) {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Handle scroll for loading more
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || loading || !hasMore) return;

    if (container.scrollTop < 100) {
      onLoadMore();
    }
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">No messages yet. Say something!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col overflow-y-auto px-4 py-2"
    >
      {hasMore && (
        <div className="py-2 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-sm text-brand-400 transition hover:text-brand-300 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load older messages"}
          </button>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isOwn = msg.user.id === user?.id;
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showAuthor = !prevMsg || prevMsg.user.id !== msg.user.id;

        return (
          <div
            key={msg.id}
            className={`group flex flex-col ${showAuthor ? "mt-3" : "mt-0.5"}`}
          >
            {showAuthor && (
              <div className="mb-0.5 flex items-baseline gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isOwn ? "text-brand-400" : "text-gray-300"
                  }`}
                >
                  {msg.user.username}
                </span>
                <span className="text-xs text-gray-600">{formatTime(msg.createdAt)}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <p className="min-w-0 break-words text-sm leading-relaxed text-gray-200">
                {msg.content}
              </p>
              {!showAuthor && (
                <span className="hidden shrink-0 text-xs text-gray-700 group-hover:inline">
                  {formatTime(msg.createdAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
