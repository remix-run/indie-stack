import { register as registerNotesWebhook } from '~/webhooks/note-webhook.server'

let firstRun = true
export function registerWebhooks() {
	if (firstRun) {
		registerNotesWebhook()
		// TODO: Add other webhook registration calls here...
		firstRun = false
	}
}

