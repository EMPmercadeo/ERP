import { redirect } from 'next/navigation';

// La configuración de WooCommerce se movió a Configuración → Integraciones,
// porque es una integración (se configura una vez), no una pantalla operativa
// del día a día como el resto de /pos. Este archivo solo existe para no romper
// enlaces o marcadores antiguos a /pos/woocommerce.
export default function WooCommerceRedirectPage() {
  redirect('/settings?tab=integrations');
}
