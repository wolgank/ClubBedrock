import { Console, log } from 'console';
import React, { createContext, useEffect, useState } from 'react';

interface Account {
  email: string;
  role: string;
}

interface User {
  id: number;
  name: string;
  lastname: string;
}

  //  "membership": {
  //       "membershipId": 7,
  //       "code": "25062607",
  //       "state": "ACTIVE",
  //       "startDate": "2025-06-28T00:00:00.000Z",
  //       "endDate": null,
  //       "active": 1
  //   }
interface Membership {
  membershipId: number;
  code: string;
  state: string;
  startDate: Date,
  endDate: Date,
  active: boolean,
}

interface UserContextType {
  account: Account | null;
  user: User | null;
  reloadUser: () => void;
  loading: boolean;   
  membership: Membership;       //estado loading
}

const UserContext = createContext<UserContextType>({
  account: null,
  user: null,
  reloadUser: () => {},
  loading: false,
  membership: null,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);  // <-- estado loading inicial true
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const reloadUser = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) {
          // No autorizado: usuario no logueado, no mostrar error
          setAccount(null);
          setUser(null);
          return;
        }
        throw new Error(`Error HTTP: ${res.status}`);
      }
      const data = await res.json();
      setAccount(data.account);
      setUser(data.user);
      setMembership(data.membership);
    } catch (err) {
      console.error("Error obteniendo datos de usuario:", err);
      setAccount(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    window.addEventListener("authChanged", reloadUser);
    reloadUser();
    return () => window.removeEventListener("authChanged", reloadUser);
  }, [reloadUser]);

  return (
    <UserContext.Provider value={{ account, user, reloadUser, loading,membership }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  return React.useContext(UserContext);
}

