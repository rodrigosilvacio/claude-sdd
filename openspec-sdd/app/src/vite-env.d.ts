/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" habilita ganchos de teste e2e (window.__gemeo). */
  readonly VITE_E2E?: string
}
