import {describe, it, expect} from 'vitest';
import {IPHelper} from '../../../src/Utils/IPHelper.js';

describe('IPHelper.isIPv4', () => {

    it('accepts valid IPv4', () => {
        expect(IPHelper.isIPv4('192.168.1.1')).toBe(true);
        expect(IPHelper.isIPv4('0.0.0.0')).toBe(true);
        expect(IPHelper.isIPv4('255.255.255.255')).toBe(true);
    });

    it('rejects octet > 255', () => {
        expect(IPHelper.isIPv4('256.0.0.1')).toBe(false);
        expect(IPHelper.isIPv4('192.168.1.300')).toBe(false);
    });

    it('rejects too few octets', () => {
        expect(IPHelper.isIPv4('192.168.1')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(IPHelper.isIPv4('')).toBe(false);
    });

    it('rejects IPv6 address', () => {
        expect(IPHelper.isIPv4('::1')).toBe(false);
    });

    it('rejects letters', () => {
        expect(IPHelper.isIPv4('abc.def.ghi.jkl')).toBe(false);
    });

});

describe('IPHelper.isIPv6', () => {

    it('accepts valid full IPv6', () => {
        expect(IPHelper.isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        expect(IPHelper.isIPv6('0000:0000:0000:0000:0000:0000:0000:0001')).toBe(true);
    });

    it('rejects compressed IPv6 (not supported by simple regex)', () => {
        expect(IPHelper.isIPv6('::1')).toBe(false);
    });

    it('rejects IPv4 address', () => {
        expect(IPHelper.isIPv6('192.168.1.1')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(IPHelper.isIPv6('')).toBe(false);
    });

    it('rejects too few groups', () => {
        expect(IPHelper.isIPv6('2001:0db8:85a3:0000:0000:8a2e:0370')).toBe(false);
    });

});