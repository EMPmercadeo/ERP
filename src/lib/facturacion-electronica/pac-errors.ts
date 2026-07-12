// Traduce los códigos/mensajes crudos que devuelve el PAC/DGI a lenguaje plano para el dueño
// de la PyME. El código técnico se conserva aparte (logs de auditoría) para soporte, pero
// nunca debe ser el único texto que ve el usuario cuando una factura es rechazada.
const PAC_ERROR_MESSAGES: Record<string, string> = {
  'ERR-HTTP': 'No se pudo conectar con el proveedor autorizado (PAC). Verifica tu conexión a internet e intenta de nuevo en unos minutos.',
};

export function humanizePacError(codigoResultado?: string | null, mensajeResultado?: string | null): string {
  if (codigoResultado && PAC_ERROR_MESSAGES[codigoResultado]) {
    return PAC_ERROR_MESSAGES[codigoResultado];
  }
  const mensaje = (mensajeResultado || '').trim();
  if (!mensaje) {
    return 'La DGI/PAC rechazó el documento. Revisa los datos de la factura e intenta de nuevo, o contacta soporte si el problema persiste.';
  }
  return `La DGI/PAC rechazó el documento: ${mensaje}. Revisa los datos de la factura e intenta de nuevo, o contacta soporte si el problema persiste.`;
}
