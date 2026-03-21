import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { routes } from './router'
import { vuetify } from './plugins/vuetify'

export const createApp = ViteSSG(
	App,
	{ routes },
	({ app }) => {
		app.use(createPinia())
		app.use(vuetify)
	},
)
