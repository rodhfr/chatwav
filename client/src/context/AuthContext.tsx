import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../api/client";
import { connectSocket, disconnectSocket } from "../socket";
import type { User, AuthResponse } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("chatwav_token");
    const savedUser = localStorage.getItem("chatwav_user");

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setToken(savedToken);
        setUser(parsed);
        connectSocket(savedToken);
      } catch {
        localStorage.removeItem("chatwav_token");
        localStorage.removeItem("chatwav_user");
      }
    }

    setLoading(false);
  }, []);

  const saveSession = useCallback((data: AuthResponse) => {
    localStorage.setItem("chatwav_token", data.token);
    localStorage.setItem("chatwav_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      saveSession(res.data);
    },
    [saveSession]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/register", {
        email,
        username,
        password,
      });
      saveSession(res.data);
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("chatwav_token");
    localStorage.removeItem("chatwav_user");
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
