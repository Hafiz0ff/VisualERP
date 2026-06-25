export function generateIdempotencyKey(): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 16)
    : Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
  return `ve_${timestamp}_${random}`;
}
