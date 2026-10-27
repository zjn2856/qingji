import 'fake-indexeddb/auto';

if (!globalThis.crypto.randomUUID) {
  let sequence = 0;
  globalThis.crypto.randomUUID = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
}
