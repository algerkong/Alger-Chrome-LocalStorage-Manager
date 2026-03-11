import { StorageItem } from '../types';

export function exportToJson(items: StorageItem[]): void {
  const data = items.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `storage-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(file: File): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          reject(new Error('Invalid format: expected a JSON object'));
          return;
        }
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          result[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        resolve(result);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
