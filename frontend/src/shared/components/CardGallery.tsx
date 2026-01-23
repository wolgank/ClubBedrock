import React from "react";
import { useNavigate } from "react-router-dom";

const cards = [
  {
    title: "Reserva de espacios",
    desc: "Reserva espacios de distintos tipos para el desarrollo de sus actividades preferidas",
    img: `${import.meta.env.VITE_BACKEND_URL_MEDIA}/reserva.jpg`,
    path: "/reservas",
  },
  {
    title: "Academias deportivas",
    desc: "Inscríbete a academias con espacios de último nivel en modalidades formativas y competitivas",
    img: `${import.meta.env.VITE_BACKEND_URL_MEDIA}/academias.jpg`,
    path: "/academias",
  },
  {
    title: "Eventos",
    desc: "Consigue tu entrada a los festivales, conciertos y charlas que organiza el club.",
    img: `${import.meta.env.VITE_BACKEND_URL_MEDIA}/eventos.jpg`,
    path: "/eventos",
  },
  {
    title: "Noticias",
    desc: "Conoce las principales novedades que llegan a Club Bedrock.",
    img: `${import.meta.env.VITE_BACKEND_URL_MEDIA}/noticias.jpg`,
    path: "/noticias",
  },
  {
    title: "Calendario",
    desc: "Entérate de tus próximas actividades y las del club.",
    img: `${import.meta.env.VITE_BACKEND_URL_MEDIA}/calendario.jpg`,
    path: "/calendario",
  },
];

export default function CardGallery() {
  const navigate = useNavigate();

  return (
    <section
      className="
    w-screen max-w-full overflow-x-hidden
    px-2 md:px-4
  "
    >
      <div
        className="
      max-w-[90rem] mx-auto
      grid grid-cols-1 gap-6
      md:grid-cols-2
      pb-6
    "
      >
        {cards.map(({ title, desc, img, path }) => {
          const isEvento = path === "/eventos";
          return (
            <div
              key={title}
              onClick={() => navigate(path)}
              className={`
            relative rounded-xl overflow-hidden cursor-pointer flex
            bg-cover bg-center
            shadow-none
            h-96
            ${isEvento ? "md:col-span-2 md:h-[28rem]" : ""}
          `}
              style={{ backgroundImage: `url(${img})` }}
            >
              <div className="m-auto text-center text-white p-6">
                <h2 className="mb-2 text-3xl font-bold">{title}</h2>
                <p className="mb-6 text-base">{desc}</p>
                <button className="btn-brand">ⓘ Ver más</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
