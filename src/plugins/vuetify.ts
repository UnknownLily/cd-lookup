import 'vuetify/lib/styles/main.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'archive',
    themes: {
      archive: {
        dark: false,
        colors: {
          primary: '#8e4b2a',
          secondary: '#466a74',
          accent: '#bf7d45',
          success: '#497351',
          warning: '#a26b1a',
          error: '#9d4040',
          background: '#f5ede2',
          surface: '#fffaf4',
          'surface-variant': '#efe4d6',
          'on-surface': '#1f2d33',
          'on-surface-variant': '#5d6b70',
          outline: '#d4c2af',
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'xl',
    },
    VBtn: {
      rounded: 'xl',
      elevation: 0,
    },
    VChip: {
      rounded: 'xl',
      size: 'small',
    },
    VTextField: {
      density: 'comfortable',
      variant: 'outlined',
      hideDetails: 'auto',
    },
    VCombobox: {
      density: 'comfortable',
      variant: 'outlined',
      hideDetails: 'auto',
      chips: true,
      closableChips: true,
    },
  },
})
