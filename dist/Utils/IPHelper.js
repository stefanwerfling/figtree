export class IPHelper {
    static isIPv4(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/u;
        if (ipv4Regex.test(ip)) {
            return ip.split('.').every((part) => parseInt(part, 10) <= 255);
        }
        return false;
    }
    static isIPv6(ip) {
        const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/iu;
        if (ipv6Regex.test(ip)) {
            return ip.split(':').every((part) => part.length <= 4);
        }
        return false;
    }
}
//# sourceMappingURL=IPHelper.js.map