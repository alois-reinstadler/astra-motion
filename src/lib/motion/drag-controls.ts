export interface DragStartOptions {
	snapToCursor?: boolean;
	distanceThreshold?: number;
}

/** The attachment owns the session; controls only route imperative requests. */
export interface DragParticipant {
	start(event: PointerEvent, options?: DragStartOptions): void;
	stop(): void;
	cancel(): void;
}

export class DragControls {
	private participants = new Set<DragParticipant>();

	/** @internal Automatically called by a motion attachment. */
	subscribe(participant: DragParticipant): () => void {
		this.participants.add(participant);
		return () => {
			this.participants.delete(participant);
		};
	}

	start(event: PointerEvent, options: DragStartOptions = {}): void {
		if (
			options.distanceThreshold !== undefined &&
			(!Number.isFinite(options.distanceThreshold) || options.distanceThreshold < 0)
		) {
			throw new Error('Astra drag distanceThreshold must be a finite non-negative number.');
		}
		for (const participant of [...this.participants]) participant.start(event, options);
	}

	stop(): void {
		for (const participant of [...this.participants]) participant.stop();
	}

	cancel(): void {
		for (const participant of [...this.participants]) participant.cancel();
	}
}

/** Create once during component initialization. No React hook rules or browser access. */
export const useDragControls = (): DragControls => new DragControls();
