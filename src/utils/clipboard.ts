import { StorageItem } from '../types';

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function generateSetupCode(items: StorageItem[]): string {
  const data = items.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);
  return `var ls = ${JSON.stringify(data, null, 2)};\nObject.keys(ls).forEach(k => localStorage[k] = ls[k]);`;
}
