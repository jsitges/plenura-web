import { Resend } from 'resend';

let resend: Resend | null = null;

async function getResend(): Promise<Resend | null> {
	if (resend) return resend;

	const { env } = await import('$env/dynamic/private');
	if (!env.RESEND_API_KEY) {
		console.warn('RESEND_API_KEY not configured - emails disabled');
		return null;
	}

	resend = new Resend(env.RESEND_API_KEY);
	return resend;
}

export interface BookingEmailData {
	clientName: string;
	clientEmail: string;
	therapistName: string;
	therapistEmail: string;
	serviceName: string;
	scheduledAt: Date;
	address: string;
	priceCents: number;
}

const formatDate = (date: Date): string => {
	return date.toLocaleDateString('es-MX', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

const formatTime = (date: Date): string => {
	return date.toLocaleTimeString('es-MX', {
		hour: '2-digit',
		minute: '2-digit'
	});
};

const formatPrice = (cents: number): string => {
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN'
	}).format(cents / 100);
};

/**
 * Send booking confirmation to client
 */
export async function sendBookingConfirmationToClient(data: BookingEmailData): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: data.clientEmail,
			subject: `Cita confirmada con ${data.therapistName}`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .detail-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Cita Confirmada</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Tu reserva ha sido procesada</p>
    </div>
    <div class="content">
      <p>Hola <strong>${data.clientName}</strong>,</p>
      <p>Tu cita ha sido confirmada. Aqui estan los detalles:</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Terapeuta</span>
          <span class="detail-value">${data.therapistName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${formatDate(data.scheduledAt)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hora</span>
          <span class="detail-value">${formatTime(data.scheduledAt)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Direccion</span>
          <span class="detail-value">${data.address}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total</span>
          <span class="detail-value">${formatPrice(data.priceCents)}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://plenura.redbroomsoftware.com/bookings" class="button">Ver Mis Citas</a>
      </p>

      <div class="footer">
        <p>Si tienes preguntas, responde a este correo.</p>
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending client confirmation email:', error);
		return false;
	}
}

/**
 * Send new booking notification to therapist
 */
export async function sendNewBookingToTherapist(data: BookingEmailData): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: data.therapistEmail,
			subject: `Nueva cita de ${data.clientName}`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .detail-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 5px; }
    .button-secondary { background: #6b7280; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Nueva Cita</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Tienes una nueva reserva</p>
    </div>
    <div class="content">
      <p>Hola <strong>${data.therapistName}</strong>,</p>
      <p>Tienes una nueva cita pendiente de confirmacion:</p>

      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">Cliente</span>
          <span class="detail-value">${data.clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Servicio</span>
          <span class="detail-value">${data.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${formatDate(data.scheduledAt)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hora</span>
          <span class="detail-value">${formatTime(data.scheduledAt)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Direccion</span>
          <span class="detail-value">${data.address}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pago</span>
          <span class="detail-value">${formatPrice(data.priceCents)}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="https://plenura.redbroomsoftware.com/therapist/bookings" class="button">Ver y Confirmar</a>
      </p>

      <div class="footer">
        <p>Confirma o rechaza la cita desde tu panel de control.</p>
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending therapist notification email:', error);
		return false;
	}
}

/**
 * Send booking cancellation notification
 */
export async function sendBookingCancellation(
	email: string,
	name: string,
	data: BookingEmailData,
	cancelledBy: 'client' | 'therapist'
): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	const reason =
		cancelledBy === 'client'
			? 'El cliente ha cancelado la cita.'
			: 'El terapeuta ha cancelado la cita.';

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: email,
			subject: 'Cita cancelada',
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #f87171 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .detail-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Cita Cancelada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <p>${reason}</p>

      <div class="detail-box">
        <p><strong>Servicio:</strong> ${data.serviceName}</p>
        <p><strong>Fecha:</strong> ${formatDate(data.scheduledAt)} a las ${formatTime(data.scheduledAt)}</p>
      </div>

      <p>Si el pago ya fue procesado, el reembolso se realizara automaticamente.</p>

      <div class="footer">
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending cancellation email:', error);
		return false;
	}
}

/**
 * Send booking reminder (24h before)
 */
export async function sendBookingReminder(
	email: string,
	name: string,
	data: BookingEmailData
): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: email,
			subject: `Recordatorio: Cita manana con ${data.therapistName}`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .detail-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Recordatorio de Cita</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Tu cita es manana</p>
    </div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <p>Te recordamos que tienes una cita programada para manana:</p>

      <div class="detail-box">
        <p><strong>Terapeuta:</strong> ${data.therapistName}</p>
        <p><strong>Servicio:</strong> ${data.serviceName}</p>
        <p><strong>Hora:</strong> ${formatTime(data.scheduledAt)}</p>
        <p><strong>Direccion:</strong> ${data.address}</p>
      </div>

      <p style="text-align: center;">
        <a href="https://plenura.redbroomsoftware.com/bookings" class="button">Ver Detalles</a>
      </p>

      <div class="footer">
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending reminder email:', error);
		return false;
	}
}

/**
 * Send review request email after completed booking
 */
export async function sendReviewRequest(
	email: string,
	name: string,
	data: BookingEmailData,
	bookingId: string
): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: email,
			subject: `Como fue tu sesion con ${data.therapistName}?`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .stars { text-align: center; margin: 30px 0; font-size: 40px; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Tu Opinion Importa</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Cuentanos sobre tu experiencia</p>
    </div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <p>Esperamos que hayas disfrutado tu sesion de <strong>${data.serviceName}</strong> con <strong>${data.therapistName}</strong>.</p>

      <div class="stars">
        ⭐⭐⭐⭐⭐
      </div>

      <p>Tu calificacion ayuda a otros usuarios a encontrar los mejores terapeutas y ayuda a ${data.therapistName} a seguir mejorando.</p>

      <p style="text-align: center; margin-top: 30px;">
        <a href="https://plenura.redbroomsoftware.com/bookings/${bookingId}/review" class="button">Dejar Resena</a>
      </p>

      <div class="footer">
        <p>Gracias por usar Plenura.</p>
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending review request email:', error);
		return false;
	}
}

/**
 * Send tip received notification to therapist
 */
export async function sendTipNotification(
	therapistEmail: string,
	therapistName: string,
	clientName: string,
	amountCents: number,
	serviceName: string
): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: therapistEmail,
			subject: `${clientName} te envio una propina!`,
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .amount-box { background: white; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .amount { font-size: 48px; font-weight: 700; color: #059669; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Recibiste una Propina!</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Tu cliente esta agradecido</p>
    </div>
    <div class="content">
      <p>Hola <strong>${therapistName}</strong>,</p>
      <p><strong>${clientName}</strong> te envio una propina por tu excelente servicio de <strong>${serviceName}</strong>.</p>

      <div class="amount-box">
        <div class="amount">${formatPrice(amountCents)}</div>
        <p style="margin: 10px 0 0; color: #6b7280;">Propina recibida</p>
      </div>

      <p>El monto sera agregado a tu proximo pago. Sigue brindando un excelente servicio!</p>

      <p style="text-align: center; margin-top: 30px;">
        <a href="https://plenura.redbroomsoftware.com/therapist/earnings" class="button">Ver Ganancias</a>
      </p>

      <div class="footer">
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending tip notification email:', error);
		return false;
	}
}

/**
 * Send weekly report to therapist (premium feature)
 */
export async function sendWeeklyReport(
	therapistEmail: string,
	therapistName: string,
	stats: {
		bookingsCompleted: number;
		totalEarningsCents: number;
		tipsCents: number;
		avgRating: number;
		newReviews: number;
	}
): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: therapistEmail,
			subject: 'Tu resumen semanal en Plenura',
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-card { background: white; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 28px; font-weight: 700; color: #7c3aed; }
    .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Resumen Semanal</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Tu rendimiento de la semana</p>
    </div>
    <div class="content">
      <p>Hola <strong>${therapistName}</strong>,</p>
      <p>Aqui esta tu resumen de la ultima semana:</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.bookingsCompleted}</div>
          <div class="stat-label">Citas completadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatPrice(stats.totalEarningsCents)}</div>
          <div class="stat-label">Ganancias totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatPrice(stats.tipsCents)}</div>
          <div class="stat-label">Propinas recibidas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'} ⭐</div>
          <div class="stat-label">Calificacion promedio</div>
        </div>
      </div>

      ${stats.newReviews > 0 ? `<p>Recibiste <strong>${stats.newReviews} nueva${stats.newReviews > 1 ? 's' : ''} resena${stats.newReviews > 1 ? 's' : ''}</strong> esta semana.</p>` : ''}

      <p style="text-align: center; margin-top: 30px;">
        <a href="https://plenura.redbroomsoftware.com/therapist" class="button">Ver Dashboard</a>
      </p>

      <div class="footer">
        <p>Sigue asi! Tu dedicacion marca la diferencia.</p>
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending weekly report email:', error);
		return false;
	}
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
	const client = await getResend();
	if (!client) return false;

	try {
		await client.emails.send({
			from: 'Plenura <noreply@plenura.redbroomsoftware.com>',
			to: email,
			subject: 'Bienvenido a Plenura',
			html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .feature { display: flex; align-items: flex-start; margin: 20px 0; }
    .feature-icon { width: 40px; height: 40px; background: #7c3aed; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-size: 20px; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Bienvenido a Plenura</h1>
      <p style="margin: 15px 0 0; opacity: 0.9; font-size: 16px;">Tu bienestar, a domicilio</p>
    </div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <p>Gracias por unirte a Plenura. Estamos emocionados de tenerte con nosotros.</p>

      <h3>Que puedes hacer en Plenura:</h3>

      <div class="feature">
        <div class="feature-icon">🔍</div>
        <div>
          <strong>Buscar terapeutas</strong>
          <p style="margin: 5px 0 0; color: #6b7280;">Encuentra masajistas, fisioterapeutas y mas cerca de ti.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">📅</div>
        <div>
          <strong>Reservar facilmente</strong>
          <p style="margin: 5px 0 0; color: #6b7280;">Elige fecha, hora y paga de forma segura.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">🏠</div>
        <div>
          <strong>Servicio a domicilio</strong>
          <p style="margin: 5px 0 0; color: #6b7280;">Recibe tu tratamiento en la comodidad de tu hogar.</p>
        </div>
      </div>

      <p style="text-align: center; margin-top: 30px;">
        <a href="https://plenura.redbroomsoftware.com/therapists" class="button">Explorar Terapeutas</a>
      </p>

      <div class="footer">
        <p>Si tienes preguntas, responde a este correo.</p>
        <p>&copy; 2024 Plenura. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
			`
		});
		return true;
	} catch (error) {
		console.error('Error sending welcome email:', error);
		return false;
	}
}
