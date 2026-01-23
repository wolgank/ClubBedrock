import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Role = "employee" | "member" | "guest" | null;

interface AuthContextProps {
  role: Role;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(null);
  const navigate = useNavigate();

  const login = async (email: string) => {
    if (email === "admin@club.com") {
      setRole("employee");
      navigate("/employee");
    } else if (email === "miembro@club.com") {
      setRole("member");
      navigate("/reservas");
    } else if (email === "invitado@club.com") {
      setRole("guest");
      navigate("/guest");
    } else {
      toast.error("Credenciales inválidas");
    }
  };

  const logout = () => {
    setRole(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
