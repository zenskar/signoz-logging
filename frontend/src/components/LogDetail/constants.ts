export const VIEW_TYPES = {
	OVERVIEW: 'OVERVIEW',
	JSON: 'JSON',
	CONTEXT: 'CONTEXT',
} as const;

export type VIEWS = typeof VIEW_TYPES[keyof typeof VIEW_TYPES];
