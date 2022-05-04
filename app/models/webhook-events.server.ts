import type { WebhookEvent } from '@prisma/client'
import { prisma } from '~/db.server'

export enum WebhookEventState {
	// noinspection JSUnusedGlobalSymbols
	PENDING = 'PENDING',
	PROCESSING = 'PROCESSING',
	PROCESSED = 'PROCESSED',
	FAILED = 'FAILED',
}

export async function isWebhookEventDuplicated(service: string, externalId: string): Promise<boolean> {
	const duplicate = await prisma.webhookEvent.findUnique({
		where: {
			service_externalId: {
				service,
				externalId,
			},
		},
	})
	return !!duplicate
}

export async function addWebhookEventToQueue(service: string, externalId: string, event: string): Promise<void> {
	await prisma.webhookEvent.create({
		data: {
			service,
			externalId,
			event,
		},
	})
}

export async function getUnprocessedWebhookEvents(
	{
		excludeFailures = false,
	}: {
		excludeFailures?: boolean
	} = { excludeFailures: false },
): Promise<WebhookEvent[]> {
	return prisma.webhookEvent.findMany({
		where: excludeFailures
			? { AND: [{ state: { not: 'PROCESSED' } }, { state: { not: 'FAILED' } }] }
			: { state: { not: 'PROCESSED' } },
		orderBy: {
			createdAt: 'asc',
		},
	})
}

export async function setWebhookEventState({
	service,
	externalId,
	state,
	reason,
}: {
	service: string
	externalId: string
	state: WebhookEventState
	reason?: string
}): Promise<WebhookEvent> {
	return prisma.webhookEvent.update({
		where: {
			service_externalId: {
				service: service,
				externalId: externalId,
			},
		},
		data: {
			state,
			...(reason ? { failReason: reason } : {}),
		},
	})
}
