import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <h1 className="mb-3 text-5xl font-bold tracking-tight text-white">
        Chat<span className="text-brand-400">Wav</span>
      </h1>
      <p className="mb-8 max-w-md text-center text-lg text-gray-400">
        Real-time chat rooms powered by WebSockets. Create rooms, invite people, and
        start conversations that flow.
      </p>

      {user ? (
        <Link
          to="/chat"
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Open Chat
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link
            to="/signin"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            Get started
          </Link>
        </div>
      )}

      <div className="mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 font-semibold text-white">Real-time</h3>
          <p className="text-sm text-gray-400">
            Messages delivered instantly through WebSocket connections. No polling, no delays.
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 font-semibold text-white">Rooms</h3>
          <p className="text-sm text-gray-400">
            Create topic-based chat rooms. Join the ones that interest you.
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 font-semibold text-white">Presence</h3>
          <p className="text-sm text-gray-400">
            See who is online and who is typing in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
