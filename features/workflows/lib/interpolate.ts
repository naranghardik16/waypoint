export type NodeOutputs = Record<string, unknown>

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g

function getByPath(obj: unknown, path: string): unknown {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean)
  return keys.reduce<unknown>(
    (value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]),
    obj
  )
}

// Replaces {{ nodeId.path }} placeholders in a field's text with values from
// this run's node outputs, keyed by node id.
export function interpolate(text: string, outputs: NodeOutputs): string {
  return text.replace(PLACEHOLDER, (_match, path: string) => {
    const value = getByPath(outputs, path)
    if (value === undefined || value === null) return ""
    return typeof value === "object" ? JSON.stringify(value) : String(value)
  })
}
