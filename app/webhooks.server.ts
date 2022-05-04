import type { WebhookEvent } from '@prisma/client'
import { getUnprocessedWebhookEvents, setWebhookEventState, WebhookEventState } from '~/models/webhook-events.server'

export type ServiceEventValidation = {
	service: string
	signatureMatches: boolean
	shouldProcessEvent?: boolean
	externalId?: string
	payload?: string
}

export type ServiceDefinition = {
	code: string
	validateEvent: (request: Request) => Promise<ServiceEventValidation>
	processEvent: (serializedEvent: string) => Promise<boolean>
}

const knownServices: ServiceDefinition[] = []

export function registerWebhookService(serviceDefinition: ServiceDefinition) {
	knownServices.push(serviceDefinition)
}

export function extractServiceFromUrl(url: string): string {
	const re = new RegExp('[^/]+(?=/$|$)')
	const knownServiceCodes = knownServices.map(it => it.code)
	const matches = url.toLowerCase().match(re)
	if (matches && matches.length > 0 && knownServiceCodes.includes(matches[0] as string)) {
		return matches[0] as string
	}
	return 'UNKNOWN'
}

export function validateEndpoint(request: Request): boolean {
	const service = extractServiceFromUrl(request.url)
	return service !== 'UNKNOWN'
}

export async function validateWebhookEvent(request: Request): Promise<ServiceEventValidation> {
	const service = extractServiceFromUrl(request.url)
	const validationResult = await knownServices.find(it => it.code === service)?.validateEvent(request)
	return {
		service: validationResult?.service || 'UNKNOWN',
		signatureMatches: validationResult?.signatureMatches || false,
		shouldProcessEvent: validationResult?.shouldProcessEvent || false,
		externalId: validationResult?.externalId || new Date().getTime().toString(),
		payload: validationResult?.payload,
	}
}

export async function processWebhookEvents(): Promise<void> {
	let unprocessedEvents: WebhookEvent[] = await getUnprocessedWebhookEvents()
	while (unprocessedEvents.length > 0) {
		for (let i = 0; i < unprocessedEvents.length; i++) {
			const it = unprocessedEvents[i]
			await setWebhookEventState({
				service: it.service,
				externalId: it.externalId,
				state: WebhookEventState.PROCESSING,
			})

			try {
				const service = knownServices.find(svc => svc.code === it.service)
				const success = (await service?.processEvent(it.event)) || false
				await setWebhookEventState({
					service: it.service,
					externalId: it.externalId,
					state: success ? WebhookEventState.PROCESSED : WebhookEventState.FAILED,
				})
			} catch (e: any) {
				await setWebhookEventState({
					service: it.service,
					externalId: it.externalId,
					state: WebhookEventState.FAILED,
					reason: e.message,
				})
				console.error(`webhooks.server: processWebhookEvents: ${e.message}`)
			}

			unprocessedEvents = await getUnprocessedWebhookEvents({ excludeFailures: true })
		}
	}
}
