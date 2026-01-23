import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {
      method: "GET",
      credentials: "include", // Muy importante para enviar la cookie
    })
      .catch((err) => console.error("Error cerrando sesión:", err))
      .finally(() => {
        //console.log("Sesión cerrada y datos eliminados");

        window.dispatchEvent(new Event("authChanged"));
        navigate("/");
      });
  }, [navigate]);

  return null;
}
