<script lang="ts">
	const lastUpdated = '21 de diciembre de 2025';
</script>

<svelte:head>
	<title>Aviso de Privacidad - Plenura</title>
	<meta name="description" content="Aviso de privacidad y protección de datos personales de Plenura" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<a href="/" class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Volver al inicio
			</a>
			<h1 class="text-3xl sm:text-4xl font-bold text-gray-900">Aviso de Privacidad</h1>
			<p class="mt-2 text-gray-600">Última actualización: {lastUpdated}</p>
		</div>
	</div>

	<!-- Content -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
			<div class="prose prose-gray max-w-none">
				<!-- Introducción -->
				<section class="mb-10">
					<p class="text-gray-600 leading-relaxed">
						En cumplimiento con lo dispuesto por la Ley Federal de Protección de Datos Personales en
						Posesión de los Particulares (LFPDPPP) y su Reglamento, <strong>Plenura Technologies S.A.P.I. de C.V.</strong>
						("Plenura", "nosotros" o "la Empresa"), con domicilio en Ciudad de México, México, pone a
						su disposición el presente Aviso de Privacidad.
					</p>
				</section>

				<!-- 1. Identidad y domicilio del responsable -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">1. Identidad y Domicilio del Responsable</h2>
					<p class="text-gray-600 leading-relaxed">
						<strong>Plenura Technologies S.A.P.I. de C.V.</strong> es responsable del tratamiento de sus
						datos personales, con domicilio en:
					</p>
					<p class="text-gray-600 leading-relaxed mt-3">
						Av. Insurgentes Sur 1602, Col. Crédito Constructor<br />
						Alcaldía Benito Juárez, C.P. 03940<br />
						Ciudad de México, México
					</p>
				</section>

				<!-- 2. Datos personales que recabamos -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">2. Datos Personales que Recabamos</h2>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.1 Datos de identificación</h3>
					<ul class="list-disc list-inside text-gray-600 space-y-2">
						<li>Nombre completo</li>
						<li>Fecha de nacimiento</li>
						<li>Fotografía</li>
						<li>Identificación oficial (INE, pasaporte)</li>
						<li>CURP (para Terapeutas)</li>
						<li>RFC (para Terapeutas con facturación)</li>
					</ul>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.2 Datos de contacto</h3>
					<ul class="list-disc list-inside text-gray-600 space-y-2">
						<li>Correo electrónico</li>
						<li>Número de teléfono celular</li>
						<li>Dirección física</li>
					</ul>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.3 Datos financieros</h3>
					<ul class="list-disc list-inside text-gray-600 space-y-2">
						<li>Información de tarjetas de crédito/débito (procesada de forma segura por terceros)</li>
						<li>Datos bancarios para depósitos (solo Terapeutas)</li>
						<li>Historial de transacciones en la plataforma</li>
					</ul>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.4 Datos de salud (sensibles)</h3>
					<p class="text-gray-600 leading-relaxed">
						Para ofrecer un mejor servicio, podemos recabar información de salud que usted proporcione
						voluntariamente:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-2">
						<li>Condiciones médicas relevantes para el servicio</li>
						<li>Alergias</li>
						<li>Embarazo</li>
						<li>Lesiones o áreas sensibles</li>
					</ul>
					<p class="text-gray-600 leading-relaxed mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
						<strong>Nota:</strong> Los datos de salud son considerados datos personales sensibles conforme
						a la LFPDPPP. Su tratamiento requiere de su consentimiento expreso, el cual otorga al aceptar
						este Aviso de Privacidad.
					</p>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">2.5 Datos de uso y navegación</h3>
					<ul class="list-disc list-inside text-gray-600 space-y-2">
						<li>Dirección IP</li>
						<li>Tipo de dispositivo y navegador</li>
						<li>Geolocalización (con su consentimiento)</li>
						<li>Historial de búsquedas y reservas</li>
						<li>Interacciones con la plataforma</li>
					</ul>
				</section>

				<!-- 3. Finalidades del tratamiento -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">3. Finalidades del Tratamiento</h2>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">3.1 Finalidades primarias (necesarias)</h3>
					<ul class="list-disc list-inside text-gray-600 space-y-2">
						<li>Crear y administrar su cuenta de usuario</li>
						<li>Verificar su identidad</li>
						<li>Procesar reservas y pagos</li>
						<li>Facilitar la comunicación entre Clientes y Terapeutas</li>
						<li>Proporcionar atención al cliente</li>
						<li>Cumplir con obligaciones legales y fiscales</li>
						<li>Prevenir fraudes y actividades ilícitas</li>
						<li>Resolver disputas entre usuarios</li>
					</ul>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">3.2 Finalidades secundarias (opcionales)</h3>
					<ul class="list-disc list-inside text-gray-600 space-y-2">
						<li>Enviar comunicaciones promocionales y de marketing</li>
						<li>Realizar encuestas de satisfacción</li>
						<li>Personalizar su experiencia en la plataforma</li>
						<li>Elaborar estadísticas y análisis internos</li>
						<li>Notificarle sobre nuevos servicios o funcionalidades</li>
					</ul>
					<p class="text-gray-600 leading-relaxed mt-3">
						Si no desea que sus datos personales sean tratados para las finalidades secundarias,
						puede manifestarlo enviando un correo a <a href="mailto:privacidad@plenura.com" class="text-primary-600 hover:text-primary-700">privacidad@plenura.com</a>
						o configurando sus preferencias en la sección de Configuración de su cuenta.
					</p>
				</section>

				<!-- 4. Transferencias de datos -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">4. Transferencias de Datos Personales</h2>
					<p class="text-gray-600 leading-relaxed">
						Sus datos personales pueden ser transferidos y tratados dentro y fuera del país, por
						las siguientes personas o empresas:
					</p>

					<div class="overflow-x-auto mt-4">
						<table class="min-w-full border border-gray-200 rounded-lg">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Destinatario</th>
									<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Finalidad</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								<tr>
									<td class="px-4 py-3 text-sm text-gray-600">Terapeutas</td>
									<td class="px-4 py-3 text-sm text-gray-600">Prestación del servicio reservado</td>
								</tr>
								<tr>
									<td class="px-4 py-3 text-sm text-gray-600">Procesadores de pago (Stripe/Colectiva)</td>
									<td class="px-4 py-3 text-sm text-gray-600">Procesamiento de transacciones</td>
								</tr>
								<tr>
									<td class="px-4 py-3 text-sm text-gray-600">Proveedores de almacenamiento (AWS/Supabase)</td>
									<td class="px-4 py-3 text-sm text-gray-600">Almacenamiento seguro de datos</td>
								</tr>
								<tr>
									<td class="px-4 py-3 text-sm text-gray-600">Proveedores de comunicación (SendGrid/Twilio)</td>
									<td class="px-4 py-3 text-sm text-gray-600">Envío de notificaciones</td>
								</tr>
								<tr>
									<td class="px-4 py-3 text-sm text-gray-600">Autoridades competentes</td>
									<td class="px-4 py-3 text-sm text-gray-600">Cumplimiento de obligaciones legales</td>
								</tr>
							</tbody>
						</table>
					</div>

					<p class="text-gray-600 leading-relaxed mt-4">
						Nos aseguramos de que todos nuestros proveedores cumplan con estándares de seguridad
						equivalentes y tengan contratos de confidencialidad vigentes.
					</p>
				</section>

				<!-- 5. Derechos ARCO -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">5. Derechos ARCO</h2>
					<p class="text-gray-600 leading-relaxed">
						Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los
						utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho
						solicitar la corrección de su información personal en caso de que esté desactualizada,
						sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o
						bases de datos cuando considere que la misma no está siendo utilizada adecuadamente
						(Cancelación); así como oponerse al uso de sus datos personales para fines específicos
						(Oposición). Estos derechos se conocen como derechos ARCO.
					</p>

					<h3 class="text-lg font-medium text-gray-800 mt-6 mb-3">Proceso para ejercer derechos ARCO</h3>
					<p class="text-gray-600 leading-relaxed">
						Para ejercer sus derechos ARCO, debe enviar una solicitud a:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-3">
						<li><strong>Correo electrónico:</strong> <a href="mailto:privacidad@plenura.com" class="text-primary-600 hover:text-primary-700">privacidad@plenura.com</a></li>
						<li><strong>Domicilio:</strong> Av. Insurgentes Sur 1602, Col. Crédito Constructor, CDMX</li>
					</ul>

					<p class="text-gray-600 leading-relaxed mt-4">
						Su solicitud debe contener:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-2">
						<li>Nombre completo y datos de contacto</li>
						<li>Copia de identificación oficial</li>
						<li>Descripción clara del derecho que desea ejercer</li>
						<li>Cualquier documento que facilite la localización de sus datos</li>
					</ul>

					<p class="text-gray-600 leading-relaxed mt-4">
						Daremos respuesta a su solicitud en un plazo máximo de 20 días hábiles. De ser procedente,
						se hará efectiva dentro de los 15 días hábiles siguientes a la comunicación de la respuesta.
					</p>
				</section>

				<!-- 6. Revocación del consentimiento -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">6. Revocación del Consentimiento</h2>
					<p class="text-gray-600 leading-relaxed">
						Usted puede revocar el consentimiento que, en su caso, nos haya otorgado para el
						tratamiento de sus datos personales. Sin embargo, es importante que tenga en cuenta que
						no en todos los casos podremos atender su solicitud o concluir el uso de forma inmediata,
						ya que es posible que por alguna obligación legal requiramos seguir tratando sus datos
						personales.
					</p>
					<p class="text-gray-600 leading-relaxed mt-3">
						Para revocar su consentimiento, puede:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-2">
						<li>Configurar sus preferencias en la aplicación</li>
						<li>Enviar solicitud a <a href="mailto:privacidad@plenura.com" class="text-primary-600 hover:text-primary-700">privacidad@plenura.com</a></li>
						<li>Solicitar la eliminación de su cuenta</li>
					</ul>
				</section>

				<!-- 7. Uso de cookies y tecnologías de rastreo -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">7. Cookies y Tecnologías de Rastreo</h2>
					<p class="text-gray-600 leading-relaxed">
						Utilizamos cookies, web beacons y tecnologías similares para:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-3">
						<li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento de la plataforma</li>
						<li><strong>Cookies de rendimiento:</strong> Análisis de uso para mejorar la experiencia</li>
						<li><strong>Cookies de funcionalidad:</strong> Recordar sus preferencias</li>
						<li><strong>Cookies de publicidad:</strong> Mostrar anuncios relevantes (solo con consentimiento)</li>
					</ul>
					<p class="text-gray-600 leading-relaxed mt-4">
						Puede configurar su navegador para rechazar cookies o ser notificado cuando se envíen.
						Sin embargo, algunas funciones de la plataforma pueden no funcionar correctamente sin cookies.
					</p>
				</section>

				<!-- 8. Medidas de seguridad -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">8. Medidas de Seguridad</h2>
					<p class="text-gray-600 leading-relaxed">
						Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger
						sus datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-3">
						<li>Encriptación de datos en tránsito (TLS 1.3) y en reposo (AES-256)</li>
						<li>Autenticación de dos factores (2FA)</li>
						<li>Control de acceso basado en roles</li>
						<li>Monitoreo continuo de seguridad</li>
						<li>Auditorías de seguridad periódicas</li>
						<li>Capacitación del personal en protección de datos</li>
					</ul>
				</section>

				<!-- 9. Cambios al aviso de privacidad -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">9. Cambios al Aviso de Privacidad</h2>
					<p class="text-gray-600 leading-relaxed">
						Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
						Le notificaremos de cualquier cambio material a través de:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-3">
						<li>Aviso en la plataforma</li>
						<li>Correo electrónico</li>
						<li>Notificación push en la aplicación</li>
					</ul>
					<p class="text-gray-600 leading-relaxed mt-4">
						La versión actualizada estará siempre disponible en <a href="/privacy" class="text-primary-600 hover:text-primary-700">plenura.com/privacy</a>
					</p>
				</section>

				<!-- 10. Autoridad de protección de datos -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">10. Autoridad de Protección de Datos</h2>
					<p class="text-gray-600 leading-relaxed">
						Si considera que su derecho a la protección de datos personales ha sido lesionado por
						alguna conducta u omisión de nuestra parte, o presume alguna violación a las disposiciones
						previstas en la LFPDPPP y su Reglamento, puede interponer su queja o denuncia ante el
						Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos
						Personales (INAI):
					</p>
					<p class="text-gray-600 leading-relaxed mt-3">
						<strong>INAI</strong><br />
						Av. Insurgentes Sur 3211, Col. Insurgentes Cuicuilco<br />
						C.P. 04530, Ciudad de México<br />
						Teléfono: 800 835 4324<br />
						Sitio web: <a href="https://home.inai.org.mx" target="_blank" rel="noopener" class="text-primary-600 hover:text-primary-700">www.inai.org.mx</a>
					</p>
				</section>

				<!-- 11. Contacto -->
				<section class="mb-10">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
					<p class="text-gray-600 leading-relaxed">
						Si tiene preguntas o comentarios sobre este Aviso de Privacidad o el tratamiento de
						sus datos personales, puede contactar a nuestro Oficial de Protección de Datos:
					</p>
					<ul class="list-disc list-inside text-gray-600 space-y-2 mt-3">
						<li><strong>Email:</strong> <a href="mailto:privacidad@plenura.com" class="text-primary-600 hover:text-primary-700">privacidad@plenura.com</a></li>
						<li><strong>Teléfono:</strong> +52 55 1234 5678</li>
						<li><strong>Centro de Ayuda:</strong> <a href="/support" class="text-primary-600 hover:text-primary-700">plenura.com/support</a></li>
					</ul>
				</section>

				<!-- Consentimiento -->
				<section class="mt-12 p-6 bg-primary-50 rounded-xl border border-primary-100">
					<h2 class="text-lg font-semibold text-primary-900 mb-3">Consentimiento</h2>
					<p class="text-primary-800 leading-relaxed">
						Al crear una cuenta en Plenura, usted manifiesta haber leído y comprendido el presente
						Aviso de Privacidad, y otorga su consentimiento para el tratamiento de sus datos personales,
						incluyendo datos sensibles de salud, conforme a lo aquí descrito.
					</p>
				</section>

				<div class="mt-12 pt-8 border-t border-gray-200">
					<p class="text-sm text-gray-500 text-center">
						© {new Date().getFullYear()} Plenura Technologies S.A.P.I. de C.V. Todos los derechos reservados.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
