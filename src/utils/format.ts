export const formatHours = (minutes: number): string => `${Math.round(minutes / 60)}h`
export const calcProgress = (done: number, total: number): number => total === 0 ? 0 : Math.round((done / total) * 100)
