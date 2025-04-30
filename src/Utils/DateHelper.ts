/**
 * DateHelper
 */
export class DateHelper {

    /**
     * Get Current Time
     * @return {number}
     */
    public static getCurrentTime(): number {
        const tdate = new Date();
        return tdate.getTime() / 1000;
    }

    /**
     * Is over an Hour
     * @param {number} checkTime
     * @param {number} hours
     * @return {boolean}
     */
    public static isOverAHour(checkTime: number, hours: number = 1): boolean {
        const diffTime = DateHelper.getCurrentTime() - checkTime;
        const secHours = hours * 60 * 60;

        return diffTime > secHours;
    }

}