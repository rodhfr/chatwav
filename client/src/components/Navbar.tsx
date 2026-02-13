import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      <Link to="/" className="text-lg font-bold tracking-tight text-white">
        ChatWav
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-400">
              Signed in as <span className="font-medium text-gray-200">{user.username}</span>
            </span>
            <button
              onClick={logout}
              className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-gray-700"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/signin"
              className="rounded px-3 py-1.5 text-sm text-gray-300 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white transition hover:bg-brand-500"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
