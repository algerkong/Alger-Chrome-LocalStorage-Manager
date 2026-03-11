import { StorageValueType } from '../types';

export function isTimestamp(value: string): boolean {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (value.length === 13) {
    return num > 978307200000 && num < 4102444800000;
  }
  if (value.length === 10) {
    return num > 978307200 && num < 4102444800;
  }
  return false;
}

export function isNumberValue(value: string): boolean {
  return value.trim() !== '' && !isNaN(Number(value));
}

export function isJsonValue(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

export function getValueType(value: string): StorageValueType {
  if (value === 'true' || value === 'false') return 'Boolean';
  if (isTimestamp(value)) return 'Timestamp';
  if (isJsonValue(value)) return 'JSON';
  if (isNumberValue(value)) return 'Number';
  return 'String';
}

export function formatTimestamp(value: string): string {
  const num = Number(value);
  const ms = value.length === 10 ? num * 1000 : num;
  return new Date(ms).toLocaleString();
}

export function getItemSize(value: string): number {
  return new Blob([value]).size;
}
