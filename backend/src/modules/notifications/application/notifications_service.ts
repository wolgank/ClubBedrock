import { SMTPClient, Message } from 'emailjs';

const client = new SMTPClient({
  user: Bun.env.EMAIL_USER,
  password: Bun.env.EMAIL_PASS,
  host: 'smtp.gmail.com',
  ssl: true,
});

//Función auxiliar que convierte client.send a Promise
function sendAsyncMail(client: SMTPClient, message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    client.send(message, (err, msg) => {
      if (err) reject(err);
      else resolve(msg);
    });
  });
}

//Función principal para enviar correo
export async function enviarCorreo({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}) {
  try {

    const msg = new Message({
      text: message,
      from: Bun.env.EMAIL_USER ?? '',
      to,
      subject,
    });


    const response = await sendAsyncMail(client, msg);

    //console.log('Correo enviado:', response.header);
  } catch (err) {
    console.error('Error al enviar correo:', err);
    throw err;
  }
}
