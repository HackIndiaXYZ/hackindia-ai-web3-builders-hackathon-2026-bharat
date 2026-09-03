export function createMessageHash(sender: string, text: string, timestamp: number): string {
  const input = sender + '|' + text + '|' + timestamp.toString();
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 'BAP-' + (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}
