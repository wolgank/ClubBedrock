export type CorreoParams = {
  nombre: string;
  extra?: Record<string, any>;
};

type PlantillaCorreo = (params: CorreoParams) => { subject: string; message: string };

export const plantillasCorreo: Record<string, PlantillaCorreo> = {
  bienvenida: ({ nombre }) => ({
    subject: 'Bienvenido a la plataforma',
    message: `Hola ${nombre}, gracias por registrarte. Bienvenido a nuestra comunidad 🚀`,
  }),

  inscripcionExitosa: ({ nombre, extra }) => ({
    subject: 'Inscripción confirmada',
    message: `Hola ${nombre}, tu inscripción al evento "${extra?.evento}" ha sido confirmada. ¡Nos vemos el ${extra?.fecha}! 🎉`,
  }),

  eliminacionInscripcion: ({ nombre, extra }) => ({
    subject: 'Inscripción eliminada',
    message: `Hola ${nombre}, tu inscripción al evento "${extra?.evento}" ha sido cancelada. Esperamos verte en otra oportunidad.`,
  }),

  solicitudAceptada: ({ nombre, extra }) => ({
    subject: 'Solicitud aceptada',
    message: `Hola ${nombre}, tu solicitud para unirte a la academia "${extra?.academia}" ha sido aceptada. 🎓`,
  }),

  solicitudRechazada: ({ nombre, extra }) => ({
    subject: 'Solicitud rechazada',
    message: `Hola ${nombre}, lamentamos informarte que tu solicitud para unirte a la academia "${extra?.academia}" ha sido rechazada.`,
  }),

  recordatorioEvento: ({ nombre, extra }) => ({
    subject: 'Recordatorio de evento',
    message: `Hola ${nombre}, recuerda que el evento "${extra?.evento}" será el ${extra?.fecha} a las ${extra?.hora}. ¡No faltes! 📅`,
  }),

  recuperarContrasena: ({ nombre, extra }) => ({
    subject: 'Recupera tu contraseña',
    message: `Hola ${nombre}, para restablecer tu contraseña haz clic en el siguiente enlace: ${process.env.FRONTEND_URL}/reset-password?token=${extra?.token} \nEste enlace expirará en 15 minutos.`,
  }),
  eliminacionReserva: ({ nombre, extra }) => ({
    subject: 'Reserva eliminada',
    message: `Hola ${nombre}, tu reserva de "${extra?.espacio}" ha sido cancelada.`,
  }),
  eliminarInscripcionAcademiaCurso: ({ nombre, extra }) => ({
    subject: 'Inscripción a curso eliminada',
    message: `Hola ${nombre}, tu inscripción al curso "${extra?.curso}" ha sido eliminada.`,
  }),
  confirmarInscripcionAcademiaCurso: ({ nombre, extra }) => ({
    subject: 'Inscripción a curso confirmada',
    message: `Hola ${nombre}, tu inscripción al curso "${extra?.curso}" ha sido confirmada. Inicio de clases: ${extra?.fechaInicio}`,
  }),

  solicitudMembresiaAprobada: ({ nombre }) => ({
    subject: 'Solicitud aprobada',
    message: `Hola ${nombre}, se ha aprobado tu solicitud de membresía.\nEntra a la plataforma para realizar el pago de cuota de ingreso.`,
  }),
  solicitudMembresiaRechazada: ({ nombre, extra }) => ({
    subject: 'Solicitud rechazada',
    message: `Hola ${nombre}, se ha rechazado tu solicitud de membresía. El motivo es que: "${extra?.motivo}".`,
  }),
};