import { useClubConfig } from "@/modules/admin/hooks/useClubConfig";

export default function PrincipalImage() {
  const { config } = useClubConfig();

  if (!config) {
    return (
      <section className="relative w-screen max-w-full h-[900px] bg-top bg-contain bg-no-repeat mx-auto flex items-center justify-center text-white text-center">
        <p>Cargando...</p>
      </section>
    );
  }

  return (
    <section
      className="relative w-screen max-w-full h-[900px] bg-top bg-contain bg-no-repeat mx-auto"
      style={{ backgroundImage: `url(${config.portadaURL ||  `${import.meta.env.VITE_BACKEND_URL_MEDIA}/photo.jpg`})` }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
        <p className="text-xl italic drop-shadow-md">Bienvenido a</p>
        <h1 className="text-6xl font-bold drop-shadow-lg my-2">{config.name}</h1>
        <p className="text-xl italic drop-shadow-md">{config.slogan}</p>
      </div>
    </section>
  );
}
