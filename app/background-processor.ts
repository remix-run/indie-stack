import { processWebhookEvents } from '~/webhooks/webhooks.server'
import { registerWebhooks } from '~/webhooks/register-webhooks.server'

const millisecondsBetweenProcessing = 60000 // once every minute

const processStuff = async () => {
	await processWebhookEvents()
	// TODO: Add other tasks here...
	setTimeout(processStuff, millisecondsBetweenProcessing)
}
async function main(): Promise<void> {
	console.log(`Starting background processing...`)
	registerWebhooks()
	// TODO: Add other necessary initialization code here...
	setTimeout(processStuff, millisecondsBetweenProcessing)
}

main()

export {}
