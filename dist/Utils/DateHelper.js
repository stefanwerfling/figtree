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
}
//# sourceMappingURL=DateHelper.js.map