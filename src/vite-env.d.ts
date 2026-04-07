/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_S21_LOGIN: string
  readonly VITE_S21_PASSWORD: string
  readonly VITE_GOOGLE_SHEET_ID?: string
  readonly VITE_GOOGLE_SHEET_GID_SETTINGS?: string
  readonly VITE_GOOGLE_SHEET_GID_TAG_COLORS?: string
  readonly VITE_GOOGLE_SHEET_GID_CLUB_ASSETS?: string
  readonly VITE_GOOGLE_SHEET_GID_SCHOOL_ADS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
