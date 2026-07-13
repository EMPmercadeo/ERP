import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Justificación: El uso de catch variables sin usar se permite si comienzan con '_'
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      // Justificación: El tipo 'any' es común en respuestas JSON y adaptadores del ERP.
      // Se deja en "warn" (no "off") para que siga siendo visible en `npm run lint` sin
      // romper el build — una desactivación total ocultaría usos nuevos e innecesarios.
      "@typescript-eslint/no-explicit-any": "warn",
      // Justificación: Preferencias de estilo menores, no críticas para producción
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",

      // --- Reglas del Compilador de React (React 19 / Next 16) ---
      // Estas cuatro reglas se dejan en "warn" en vez de "off": permiten que el build
      // y el lint pasen sin bloquear el trabajo existente, pero mantienen visibles los
      // patrones que señalan (mutaciones en efectos, librerías incompatibles con el
      // compilador, impurezas de render, hoisting) en vez de ocultarlos por completo.
      // Justificación: Cambiar estado en useEffect es común en componentes heredados
      "react-hooks/set-state-in-effect": "warn",
      // Justificación: useReactTable retorna funciones no memoizables por diseño de la biblioteca
      "react-hooks/incompatible-library": "warn",
      // Justificación: La pureza estricta de renderizado bloquea el uso de Date.now() en ID locales de sincronización offline
      "react-hooks/purity": "warn",
      // Justificación: Llamadas a cargadores internos dentro de useEffect antes de su declaración (hoisting funcional)
      "react-hooks/immutability": "warn",

      // --- Reglas de Hooks Críticas (Advertencias en lugar de desactivación total) ---
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error" // Siempre forzar para evitar hooks condicionales o bucles infinitos
    }
  },
  // Exclusión estricta de rutas de metadatos y código congelado
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "design-review-package/**",
    ".trash_bin/**",
    ".claude/**",
    "scripts/**",
    "node_modules/**"
  ]),
]);

export default eslintConfig;
