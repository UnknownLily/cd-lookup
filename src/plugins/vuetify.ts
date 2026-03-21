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
          primary: '#F596AA',
          'on-primary': '#4f2230',
          secondary: '#C77892',
          'on-secondary': '#4f2230',
          accent: '#F37E99',
          'on-accent': '#4f2230',
          success: '#497351',
          'on-success': '#fffaf4',
          warning: '#a26b1a',
          'on-warning': '#fffaf4',
          error: '#9d4040',
          'on-error': '#fffaf4',
          background: '#fbf1f4',
          surface: '#fffaf4',
          'surface-variant': '#f6e5ea',
          'on-surface': '#1f2d33',
          'on-surface-variant': '#5d6b70',
          outline: '#e7c2cc',
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
