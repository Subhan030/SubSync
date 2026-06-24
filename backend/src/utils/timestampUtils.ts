export function formatTimestamp(seconds: number): string {
    const totalMs = Math.round(seconds * 1000);
    const ms = totalMs % 1000;
    const totalSecs = Math.floor(totalMs / 1000);
    const s = totalSecs % 60;
    const m = Math.floor(totalSecs / 60) % 60;
    const h = Math.floor(totalSecs / 3600);
    
    const pad = (num: number, size: number) => num.toString().padStart(size, '0');
    
    return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}
