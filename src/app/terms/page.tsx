import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-foreground text-white py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                        <Home className="h-5 w-5" />
                        <span className="font-semibold">ERP Panamá</span>
                    </Link>
                    <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
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
                        <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar ERP Panamá (&quot;el Servicio&quot;), usted acepta estar sujeto a estos Términos y Condiciones.
                            Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">2. Descripción del Servicio</h2>
                        <p>
                            ERP Panamá es una plataforma de gestión empresarial que incluye:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Facturación electrónica con integración a la DGI de Panamá</li>
                            <li>Gestión de clientes y productos</li>
                            <li>Control de inventario</li>
                            <li>Reportes financieros y fiscales</li>
                            <li>Gestión de cuentas por cobrar</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">3. Registro y Cuenta</h2>
                        <p>
                            Para utilizar el Servicio, debe registrarse proporcionando información veraz y completa.
                            Usted es responsable de mantener la confidencialidad de su cuenta y contraseña,
                            y acepta la responsabilidad por todas las actividades que ocurran bajo su cuenta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">4. Facturación Electrónica</h2>
                        <p>
                            El usuario es el único responsable de la veracidad de los datos ingresados en las facturas electrónicas.
                            ERP Panamá actúa como un intermediario tecnológico para la emisión de documentos fiscales
                            ante la Dirección General de Ingresos (DGI) de Panamá. El usuario debe:
                        </p>
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                            <li>Poseer un certificado digital válido emitido por la DGI</li>
                            <li>Mantener actualizados sus datos fiscales</li>
                            <li>Cumplir con todas las regulaciones fiscales vigentes</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">5. Pagos y Suscripciones</h2>
                        <p>
                            El acceso al Servicio puede requerir el pago de una suscripción mensual o anual.
                            Los precios están sujetos a cambios con previo aviso de 30 días.
                            Los pagos no son reembolsables excepto en los casos establecidos por la ley panameña.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">6. Propiedad Intelectual</h2>
                        <p>
                            El Servicio y su contenido original, características y funcionalidad son y seguirán siendo
                            propiedad exclusiva de ERP Panamá y sus licenciantes. El Servicio está protegido por
                            derechos de autor, marcas registradas y otras leyes de Panamá y países extranjeros.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitación de Responsabilidad</h2>
                        <p>
                            En ningún caso ERP Panamá, sus directores, empleados, socios, agentes, proveedores o
                            afiliados serán responsables por daños indirectos, incidentales, especiales, consecuentes
                            o punitivos, incluyendo sin limitación, pérdida de beneficios, datos, uso, buena voluntad,
                            u otras pérdidas intangibles.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">8. Modificaciones</h2>
                        <p>
                            Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento.
                            Si una revisión es material, proporcionaremos un aviso de al menos 30 días antes de que
                            los nuevos términos entren en vigencia.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">9. Ley Aplicable</h2>
                        <p>
                            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República de Panamá,
                            sin tener en cuenta sus disposiciones sobre conflictos de leyes. Cualquier disputa será
                            resuelta en los tribunales de la Ciudad de Panamá.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-foreground mb-3">10. Contacto</h2>
                        <p>
                            Si tiene alguna pregunta sobre estos Términos, puede contactarnos en:
                        </p>
                        <ul className="mt-2 space-y-1">
                            <li><strong>Email:</strong> legal@erp-panama.com</li>
                            <li><strong>Teléfono:</strong> +507 123-4567</li>
                            <li><strong>Dirección:</strong> Ciudad de Panamá, Panamá</li>
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}
