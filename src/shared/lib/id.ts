export const createId = (prefix = '') =>
  `${prefix}${prefix ? '_' : ''}${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
