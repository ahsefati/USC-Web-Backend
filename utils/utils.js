export const trimObjectKeys = obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.trim(), value]));