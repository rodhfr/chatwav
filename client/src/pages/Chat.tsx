import { useState } from "react";
import Layout from "../components/Layout";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import OnlineUsers from "../components/OnlineUsers";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";

export default function Chat() {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const { user } = useAuth();
  const {
    messages,
    onlineUsers,
    typingUsers,
    loading,
    hasMore,
    sendMessage,
    emitTyping,
    loadMore,
  } = useChat(activeRoomId);

  // Filter out current user from typing indicators
  const filteredTyping = new Map(
    [...typingUsers.entries()].filter(([id]) => id !== user?.id)
  );

  const typingText = (() => {
    const names = [...filteredTyping.values()];
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]} and ${names.length - 1} others are typing...`;
  })();

  return (
    <Layout>
      <Sidebar activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />

      <div className="flex min-w-0 flex-1 flex-col">
        {activeRoomId ? (
          <>
            <MessageList
              messages={messages}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />

            {typingText && (
              <div className="px-4 py-1">
                <span className="text-xs italic text-gray-500">{typingText}</span>
              </div>
            )}

            <MessageInput onSend={sendMessage} onTyping={emitTyping} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-400">
              Welcome to ChatWav
            </h2>
            <p className="text-sm text-gray-600">
              Select a room from the sidebar to start chatting
            </p>
          </div>
        )}
      </div>

      {activeRoomId && (
        <OnlineUsers users={onlineUsers} typingUsers={filteredTyping} />
      )}
    </Layout>
  );
}
