import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node'
import { validateEndpoint, validateWebhookEvent } from '~/webhooks/webhooks.server'
import { badRequest, notFound } from 'remix-utils'
import { addWebhookEventToQueue, isWebhookEventDuplicated } from '~/models/webhook-events.server'

export const action: ActionFunction = async ({ request }) => {
	if (!validateEndpoint(request)) {
		return notFound('NOT FOUND')
	}
	const { service, signatureMatches, shouldProcessEvent, externalId, payload } = await validateWebhookEvent(await request)
	if (!signatureMatches) {
		return badRequest({})
	}
	if (!shouldProcessEvent) {
		return json({ success: true })
	}
	if (await isWebhookEventDuplicated(service, externalId!)) {
		return json({ success: true, message: 'Previously processed' })
	}
	await addWebhookEventToQueue(service, externalId!, payload!)
	return json({ success: true }, 200)
}
