import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {DateHelper} from '../../../src/Utils/DateHelper.js';

describe('DateHelper.toStrOrNull', () => {

    it('returns ISO string for a valid date', () => {
        const date = new Date('2024-01-15T12:00:00.000Z');
        expect(DateHelper.toStrOrNull(date)).toBe('2024-01-15T12:00:00.000Z');
    });

    it('returns null for null input', () => {
        expect(DateHelper.toStrOrNull(null)).toBeNull();
    });

});

describe('DateHelper.isOverAHour', () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns false when time difference is less than 1 hour', () => {
        vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
        const checkTime = new Date('2024-01-01T11:30:00Z').getTime() / 1000;
        expect(DateHelper.isOverAHour(checkTime)).toBe(false);
    });

    it('returns true when time difference exceeds 1 hour', () => {
        vi.setSystemTime(new Date('2024-01-01T13:01:00Z'));
        const checkTime = new Date('2024-01-01T12:00:00Z').getTime() / 1000;
        expect(DateHelper.isOverAHour(checkTime)).toBe(true);
    });

    it('returns true when time difference exceeds custom hours', () => {
        vi.setSystemTime(new Date('2024-01-01T15:01:00Z'));
        const checkTime = new Date('2024-01-01T12:00:00Z').getTime() / 1000;
        expect(DateHelper.isOverAHour(checkTime, 3)).toBe(true);
    });

    it('returns false when time difference is less than custom hours', () => {
        vi.setSystemTime(new Date('2024-01-01T13:00:00Z'));
        const checkTime = new Date('2024-01-01T12:00:00Z').getTime() / 1000;
        expect(DateHelper.isOverAHour(checkTime, 3)).toBe(false);
    });

});