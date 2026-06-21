import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            <div>
                {/* Header */}
                <header className="bg-foreground text-white py-6">
                    <div className="max-w-4xl mx-auto px-4">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Home className="h-5 w-5" />
                            <span className="font-semibold">ERP Panamá</span>
                        </Link>
                        <h1 className="text-3xl font-bold">Política de Cookies</h1>
                        <p className="text-white/70 mt-2">Última actualización: 20 de junio de 2026</p>
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
                            <h2 className="text-xl font-semibold text-foreground mb-3">1. ¿Qué son las Cookies?</h2>
                            <p>
                                Las cookies son pequeños archivos de texto que los sitios web almacenan en su computadora,
                                dispositivo móvil o tableta cuando usted los visita. Estos archivos permiten que la plataforma
                                recuerde sus acciones, preferencias (como el inicio de sesión o idioma) e información de navegación
                                para optimizar y asegurar su experiencia.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">2. Cookies que Utiliza ERP Panamá</h2>
                            <p>
                                Nuestro Servicio utiliza las siguientes categorías de cookies para funcionar de forma óptima:
                            </p>
                            <ul className="list-disc ml-6 mt-2 space-y-2">
                                <li>
                                    <strong>Cookies Técnicas y Esenciales:</strong> Son indispensables para permitirle navegar por la
                                    aplicación y utilizar sus funciones básicas, como acceder a áreas seguras (Dashboard), mantener la
                                    sesión de su cuenta activa y garantizar la seguridad del sistema contra fraudes. Sin estas cookies,
                                    el Servicio no puede operar.
                                </li>
                                <li>
                                    <strong>Cookies de Preferencia y Personalización:</strong> Permiten que el Servicio recuerde elecciones
                                    que usted haya realizado en el pasado (como su nombre de usuario, filtros de tablas seleccionados, o
                                    la configuración de la barra lateral colapsada) para ofrecerle una experiencia más fluida y ágil.
                                </li>
                                <li>
                                    <strong>Cookies de Rendimiento y Analítica:</strong> Recopilan información anónima sobre cómo los
                                    usuarios interactúan con la plataforma (como las páginas más visitadas o errores del sistema) para ayudarnos
                                    a mejorar el rendimiento general del ERP.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">3. Cookies de Terceros</h2>
                            <p>
                                En algunas secciones, utilizamos servicios y herramientas de terceros que pueden almacenar cookies en su dispositivo.
                                Por ejemplo:
                            </p>
                            <ul className="list-disc ml-6 mt-2 space-y-1">
                                <li><strong>Firebase Auth (Google):</strong> Para la autenticación segura de usuarios e inicios de sesión rápidos.</li>
                                <li><strong>Base de datos local y sesiones:</strong> Tokens de sesión locales encriptados para mantener su conexión.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">4. Limitación de Responsabilidad</h2>
                            <p>
                                El uso de cookies de terceros está sujeto a las políticas de privacidad propias de dichos proveedores.
                                ERP Panamá declina toda responsabilidad por el uso que terceros hagan de los datos obtenidos a través de
                                sus respectivas cookies. Asimismo, no nos hacemos responsables de las interrupciones o fallas en el Servicio
                                si usted decide bloquear o eliminar las cookies estrictamente necesarias para el funcionamiento del sistema.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">5. ¿Cómo Controlar o Desactivar las Cookies?</h2>
                            <p>
                                Usted puede restringir, bloquear o borrar las cookies de este o cualquier otro sitio web configurando las
                                preferencias de su navegador de internet. 
                            </p>
                            <p className="mt-2">
                                Tenga en cuenta que, si decide deshabilitar o bloquear las cookies esenciales y técnicas, **muchas de las
                                funciones básicas de ERP Panamá (como iniciar sesión, guardar facturas o navegar por el Dashboard) dejarán
                                de estar disponibles o no funcionarán correctamente**.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">6. Actualizaciones de esta Política</h2>
                            <p>
                                Nos reservamos el derecho de modificar la presente Política de Cookies en cualquier momento para adaptarla a
                                cambios en el Servicio o regulaciones legales. Cualquier actualización será publicada en esta página indicando
                                la fecha de vigencia al inicio del documento.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
}
