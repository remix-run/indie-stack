import type { ProcessingResult, ServiceEventValidation } from '~/webhooks/webhooks.server'
import { registerWebhookService } from '~/webhooks/webhooks.server'
import { createNote, updateNote } from '~/models/note.server'
import { getUserByEmail } from '~/models/user.server'
import { getMessageFromError } from '~/utils'

// Note webhook calls need to have the following API key set in a Basic Auth header as the username, with no password.
// Normally this would come from the service calling the webhook, and would be retrieved from an environment variable.
const NOTES_SERVICE_API_KEY = '1f0303c1-a8f3-4313-90ac-bde268a4032f'
const SERVICE_NAME = 'notes'

// Notes webhook event has a payload that looks like this:
type NotesWebhookBody = {
	id?: string
	userEmail?: string
	title?: string
	noteContent?: string
}

async function validateEvent(request: Request): Promise<ServiceEventValidation> {
	try {
		// Many services that call webhooks (e.g. Stripe) provide an API method to validate the signature of the webhook
		// call, so you may not need to unpack the Auth header yourself like below - just call the validation method
		if (!doesInternalAuthHeaderMatchKey(Object.fromEntries(request.headers), NOTES_SERVICE_API_KEY!))
			return makeValidationErrorResponse()
		// Make sure the body of the request has the right stuff...
		if (!request.body) return makeValidationErrorResponse()
		const body = await request.json()
		if (!(body.userEmail || body.id) || !(body.title || body.noteContent)) return makeValidationErrorResponse()
		return {
			service: SERVICE_NAME,
			signatureMatches: true,
			externalId: undefined,
			shouldProcessEvent: true,
			payload: JSON.stringify(body),
		}
	} catch (e: any) {
		console.error(`validateEvent: ${e.message}`)
		return makeValidationErrorResponse()
	}
}

async function processEvent(serializedEvent: string): Promise<ProcessingResult> {
	const notesEvent: NotesWebhookBody = JSON.parse(serializedEvent)
	if (notesEvent.id) {
		try {
			const result = await updateNote({
				id: notesEvent.id,
				...(notesEvent.title ? { title: notesEvent.title! } : {}),
				...(notesEvent.noteContent ? { body: notesEvent.noteContent! } : {}),
			})
			return { success: !!result, }
		}
		catch (e: unknown) {
			return { success: false, errorMessage: getMessageFromError(e)}
		}
	}
	else {
		if (!notesEvent.userEmail || !notesEvent.title || !notesEvent.noteContent) return {
			success: false,
			errorMessage: 'Adding a new note requires a user email, title and note content'
		}
		try {
			const user = await getUserByEmail(notesEvent.userEmail)
			if (!user) return { success: false, errorMessage: 'Could not find user in database'}
			const result = await createNote({
				userId: user.id,
				title: notesEvent.title,
				body: notesEvent.noteContent,
			})
			return { success: !!result, }
		}
		catch (e) {
			return { success: false, errorMessage: getMessageFromError(e)}
		}
	}
}

function makeValidationErrorResponse() {
	return {
		service: SERVICE_NAME,
		signatureMatches: false,
	}
}
function doesInternalAuthHeaderMatchKey(headers: any, authKey: string): boolean {
	const authHeader = headers.authorization
	const re = /^Basic /
	if (!authHeader || authHeader === '' || authHeader.match(re) === null) return false
	const secret = authHeader.replace(re, '')
	const buffer = Buffer.from(secret, 'base64')
	const decodedSecret = buffer.toString().replace(':', '')
	return !(!decodedSecret || decodedSecret !== authKey)
}

export function register() {
	registerWebhookService({
		code: 'notes',
		validateEvent,
		processEvent,
	})
}
