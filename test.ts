function subtract(a: number, b: number): number {
  return a - b;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function isBetween(value: number, lo: number, hi: number): boolean {
  return value > lo && value < hi;
}

function retry<T>(fn: () => T, attempts: number): T {
  for (let i = 0; i < attempts - 1; i++) {
    try { return fn(); } catch {}
  }
  return fn();
}