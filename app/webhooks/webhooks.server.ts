import type { WebhookEvent } from '@prisma/client'
import { getUnprocessedWebhookEvents, setWebhookEventState, WebhookEventState } from '~/models/webhook-events.server'
import { getMessageFromError } from '~/utils'

export type ServiceEventValidation = {
	service: string
	signatureMatches: boolean
	shouldProcessEvent?: boolean
	externalId?: string
	payload?: string
}

export type ProcessingResult = {
	success: boolean
	errorMessage?: string
}

export type ServiceDefinition = {
	code: string
	validateEvent: (request: Request) => Promise<ServiceEventValidation>
	processEvent: (serializedEvent: string) => Promise<ProcessingResult>
}

const knownServices: ServiceDefinition[] = []
const PROCESSING_RETRIES = 3

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
	let unprocessedEvents: WebhookEvent[] = await getUnprocessedWebhookEvents({
		maxFailures: PROCESSING_RETRIES,
		excludeFailures: false
	})
	while (unprocessedEvents.length > 0) {
		for (let i = 0; i < unprocessedEvents.length; i++) {
			const it = unprocessedEvents[i]
			await setWebhookEventState({
				service: it.service,
				externalId: it.externalId,
				state: WebhookEventState.PROCESSING,
				failCount: it.failCount,
			})

			try {
				const service = knownServices.find(svc => svc.code === it.service)
				if (!service) {
					throw new Error(`Cannot find service: ${it.service}`)
				}
				const result = (await service!.processEvent(it.event))
				if (result.success) {
					await setWebhookEventState({
						service: it.service,
						externalId: it.externalId,
						state: WebhookEventState.PROCESSED,
						failCount: it.failCount,
					})
				}
				else {
					await setWebhookEventState({
						service: it.service,
						externalId: it.externalId,
						state: WebhookEventState.FAILED,
						failReason: result.errorMessage,
						failCount: (it.failCount + 1),
					})
				}
			} catch (e: unknown) {
				const message = getMessageFromError(e)
				await setWebhookEventState({
					service: it.service,
					externalId: it.externalId,
					state: WebhookEventState.FAILED,
					failReason: message,
					failCount: (it.failCount + 1)
				})
				console.error(`webhooks.server: processWebhookEvents: ${message}`)
			}

			unprocessedEvents = await getUnprocessedWebhookEvents({
				maxFailures: PROCESSING_RETRIES,
				excludeFailures: true
			})
		}
	}
}
