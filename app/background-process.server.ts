import type { ChildProcess } from 'child_process'
import { fork } from 'child_process'

let childProcess: ChildProcess | null = null

export function startBackgroundProcessing() {
	if (childProcess) return // already running
	setTimeout(() => {
		restartBackgroundProcessing()
	}, 1000)
}

export function restartBackgroundProcessing() {
	console.log('Starting background processor')
	childProcess = fork('./build/background-processor.js')
	childProcess.on('close', (code: number) => {
		console.log(`Background processing function terminated with code ${code}`)
	})
}

export function stopBackgroundProcessing() {
	console.log('Stopping background processor')
	childProcess?.kill()
}
