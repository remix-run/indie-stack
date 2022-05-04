import { register as registerNotesWebhook } from './note-webhook.server'

let firstRun = true
export function registerWebhooks() {
	if (firstRun) {
		console.log('Registering webhook handlers')
		registerNotesWebhook()
		firstRun = false
	}
}
