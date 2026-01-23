// type EmailType = 'bienvenida' | 'inscripcionExitosa' |
//                 'eliminacionExitosa' | 'solicitudAceptada' |
//                 'solicitudRechazada' | 'recordatorioEvento' |
//                 'eliminacionReserva';

export type EmailNotification = {
    email: string,
    nombre: string,
    tipo: string,
    extra?: {
        evento?: string,
        curso?: string,
        academia?: string,
        fecha?: string,
        fechaInicio?: string,
        hora?: string
    }
}