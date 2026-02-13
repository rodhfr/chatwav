import type { OnlineUser } from "../types";

interface Props {
  users: OnlineUser[];
  typingUsers: Map<string, string>;
}

export default function OnlineUsers({ users, typingUsers }: Props) {
  return (
    <div className="flex w-52 shrink-0 flex-col border-l border-gray-800 bg-gray-900">
      <div className="border-b border-gray-800 px-3 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Online -- {users.length}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {users.map((u) => {
          const isTyping = typingUsers.has(u.userId);

          return (
            <div key={u.userId} className="flex items-center gap-2 rounded px-2 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="truncate text-sm text-gray-300">{u.username}</span>
              {isTyping && (
                <span className="ml-auto text-xs italic text-gray-500">typing...</span>
              )}
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-gray-600">No users online</p>
        )}
      </div>
    </div>
  );
}
