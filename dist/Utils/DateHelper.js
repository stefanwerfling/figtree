export class DateHelper {
    static getCurrentTime() {
        const tdate = new Date();
        return tdate.getTime() / 1000;
    }
    static isOverAHour(checkTime, hours = 1) {
        const diffTime = DateHelper.getCurrentTime() - checkTime;
        const secHours = hours * 60 * 60;
        return diffTime > secHours;
    }
    static toStrOrNull(date) {
        return date ? date.toISOString() : null;
    }
}
//# sourceMappingURL=DateHelper.js.map