// ---------------------------------------------------------------------------
// Loose type for pug-tree template objects.
// The actual structure mirrors the src/templates/ directory tree.
// Using `any` here avoids needing to enumerate every template function.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Templates = Record<string, any>
