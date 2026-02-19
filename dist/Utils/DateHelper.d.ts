export declare class DateHelper {
    static getCurrentTime(): number;
    static isOverAHour(checkTime: number, hours?: number): boolean;
    static toStrOrNull(date: Date | null): string | null;
}
