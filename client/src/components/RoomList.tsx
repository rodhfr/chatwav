import type { Room } from "../types";

interface Props {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onJoinRoom: (roomId: string) => void;
}

export default function RoomList({ rooms, activeRoomId, onSelectRoom, onJoinRoom }: Props) {
  if (rooms.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-gray-500">
        No rooms yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {rooms.map((room) => {
        const isActive = room.id === activeRoomId;

        return (
          <button
            key={room.id}
            onClick={() => {
              if (room.isMember) {
                onSelectRoom(room.id);
              } else {
                onJoinRoom(room.id);
              }
            }}
            className={`group flex items-center gap-2 rounded px-3 py-2 text-left transition ${
              isActive
                ? "bg-brand-600/20 text-brand-300"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            <span className="text-lg text-gray-600">#</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{room.name}</div>
              {room.description && (
                <div className="truncate text-xs text-gray-600">{room.description}</div>
              )}
            </div>
            {!room.isMember && (
              <span className="shrink-0 rounded bg-brand-600/20 px-2 py-0.5 text-xs text-brand-400">
                Join
              </span>
            )}
            {room.isMember && room.memberCount > 0 && (
              <span className="shrink-0 text-xs text-gray-600">
                {room.memberCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
