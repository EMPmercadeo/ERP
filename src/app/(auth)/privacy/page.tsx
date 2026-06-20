import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-foreground text-white py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <Home className="h-5 w-5" />
                        <span className="font-semibold">ERP Panamá</span>
                    </Link>
                    <h1 className="text-3xl font-bold">Política de Privacidad</h1>
                    <p className="text-white/70 mt-2">Última actualización: 11 de enero de 2026</p>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <Link href="/register" className="inline-flex items-center text-primary hover:underline mb-6">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver al registro
                </Link>

                <div className="bg-card rounded-lg shadow-sm p-8 space-y-6 text-muted-foreground">
                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. Información que Recopilamos</h2>
                        <p>
                            Recopilamos información que usted nos proporciona directamente, incluyendo:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li><strong>Información de registro:</strong> nombre, correo electrónico, contraseña, nombre comercial, RUC</li>
                            <li><strong>Información fiscal:</strong> datos requeridos para la facturación electrónica ante la DGI</li>
                            <li><strong>Información de clientes:</strong> datos de sus clientes para la emisión de facturas</li>
                            <li><strong>Información de productos:</strong> catálogo de productos y servicios</li>
                            <li><strong>Información de transacciones:</strong> facturas, pagos, notas de crédito</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. Uso de la Información</h2>
                        <p>
                            Utilizamos la información recopilada para:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Proporcionar, mantener y mejorar nuestro Servicio</li>
                            <li>Procesar transacciones y enviar notificaciones relacionadas</li>
                            <li>Emitir documentos fiscales electrónicos ante la DGI</li>
                            <li>Generar reportes y análisis para su negocio</li>
                            <li>Enviar comunicaciones técnicas, actualizaciones y mensajes de soporte</li>
                            <li>Responder a sus comentarios, preguntas y solicitudes</li>
                            <li>Cumplir con obligaciones legales y fiscales</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. Compartir Información</h2>
                        <p>
                            No vendemos ni alquilamos su información personal. Podemos compartir información en las siguientes circunstancias:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li><strong>Con la DGI:</strong> Para la emisión y validación de documentos fiscales electrónicos</li>
                            <li><strong>Proveedores de servicios:</strong> Google Cloud Platform para hosting y procesamiento</li>
                            <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o proceso legal</li>
                            <li><strong>Protección de derechos:</strong> Para proteger nuestros derechos, privacidad, seguridad o propiedad</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. Seguridad de los Datos</h2>
                        <p>
                            Implementamos medidas de seguridad diseñadas para proteger su información:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Encriptación SSL/TLS para todas las transmisiones de datos</li>
                            <li>Encriptación de datos sensibles en reposo</li>
                            <li>Autenticación de dos factores disponible</li>
                            <li>Acceso restringido a datos personales</li>
                            <li>Auditorías de seguridad periódicas</li>
                            <li>Respaldos automáticos diarios</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">5. Retención de Datos</h2>
                        <p>
                            Retenemos su información mientras su cuenta esté activa o según sea necesario para proporcionarle servicios.
                            Los documentos fiscales se retienen según los requisitos legales de Panamá (mínimo 5 años).
                            Puede solicitar la eliminación de su cuenta, pero los registros fiscales deben mantenerse según la ley.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">6. Sus Derechos</h2>
                        <p>
                            Usted tiene derecho a:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Acceder a sus datos personales</li>
                            <li>Rectificar datos inexactos</li>
                            <li>Solicitar la eliminación de datos (sujeto a requisitos legales)</li>
                            <li>Exportar sus datos en formato legible</li>
                            <li>Oponerse al procesamiento de sus datos</li>
                            <li>Retirar su consentimiento en cualquier momento</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies y Tecnologías Similares</h2>
                        <p>
                            Utilizamos cookies y tecnologías similares para:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Mantener su sesión activa</li>
                            <li>Recordar sus preferencias</li>
                            <li>Analizar el uso del Servicio</li>
                            <li>Mejorar la experiencia del usuario</li>
                        </ul>
                        <p className="mt-2">
                            Puede configurar su navegador para rechazar cookies, pero esto puede afectar la funcionalidad del Servicio.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">8. Google Sign-In</h2>
                        <p>
                            Si elige iniciar sesión con Google, recibiremos su nombre, correo electrónico y foto de perfil de Google.
                            Esta información se usa únicamente para crear y administrar su cuenta en ERP Panamá.
                            No accedemos a ningún otro dato de su cuenta de Google.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">9. Menores de Edad</h2>
                        <p>
                            Nuestro Servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente
                            información personal de menores. Si descubrimos que hemos recopilado información de un menor,
                            la eliminaremos inmediatamente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">10. Cambios a esta Política</h2>
                        <p>
                            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios
                            significativos publicando la nueva política en esta página y, si es apropiado, enviándole una
                            notificación por correo electrónico.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">11. Contacto</h2>
                        <p>
                            Si tiene preguntas sobre esta Política de Privacidad, puede contactarnos en:
                        </p>
                        <ul className="mt-2 space-y-1">
                            <li><strong>Email:</strong> privacidad@erp-panama.com</li>
                            <li><strong>Teléfono:</strong> +507 123-4567</li>
                            <li><strong>Dirección:</strong> Ciudad de Panamá, Panamá</li>
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}
