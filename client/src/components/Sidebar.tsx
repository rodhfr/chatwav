import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import RoomList from "./RoomList";
import CreateRoomModal from "./CreateRoomModal";
import type { Room } from "../types";

interface Props {
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export default function Sidebar({ activeRoomId, onSelectRoom }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get<{ rooms: Room[] }>("/rooms");
      setRooms(res.data.rooms);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    // Poll for new rooms every 10 seconds
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      await api.post(`/rooms/${roomId}/join`);
      await fetchRooms();
      onSelectRoom(roomId);
    } catch (err) {
      console.error("Failed to join room:", err);
    }
  };

  return (
    <>
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 px-3 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Rooms
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded p-1 text-gray-500 transition hover:bg-gray-800 hover:text-white"
            title="Create room"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <RoomList
            rooms={rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={onSelectRoom}
            onJoinRoom={handleJoinRoom}
          />
        </div>
      </aside>

      <CreateRoomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchRooms}
      />
    </>
  );
}
