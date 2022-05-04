import { processWebhookEvents } from '~/webhooks.server'
import { registerWebhooks } from '~/webhooks/register-webhooks.server'

async function main(): Promise<void> {
	console.log(`Starting background processing...`)
	registerWebhooks()
	setInterval(async () => {
		await processWebhookEvents()
	}, 10000)
}

main()

export {}
