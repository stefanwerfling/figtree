import {describe, it, expect} from 'vitest';
import {StringHelper} from '../../../src/Utils/StringHelper.js';

describe('StringHelper.sprintf', () => {

    it('replaces %s with string', () => {
        expect(StringHelper.sprintf('hello %s', 'world')).toBe('hello world');
    });

    it('replaces %d with integer', () => {
        expect(StringHelper.sprintf('count: %d', 3.7)).toBe('count: 3');
    });

    it('replaces %f with float', () => {
        expect(StringHelper.sprintf('value: %f', '3.14')).toBe('value: 3.14');
    });

    it('replaces %j with JSON', () => {
        expect(StringHelper.sprintf('data: %j', {a: 1})).toBe('data: {"a":1}');
    });

    it('replaces %e with error name and message', () => {
        const err = new Error('something went wrong');
        expect(StringHelper.sprintf('err: %e', err)).toBe('err: Error: something went wrong');
    });

    it('replaces %e with string for non-Error', () => {
        expect(StringHelper.sprintf('err: %e', 'oops')).toBe('err: oops');
    });

    it('handles multiple replacements', () => {
        expect(StringHelper.sprintf('%s is %d years old', 'Alice', 30)).toBe('Alice is 30 years old');
    });

    it('leaves unreplaced tokens if args are exhausted', () => {
        expect(StringHelper.sprintf('%s and %s', 'only one')).toBe('only one and %s');
    });

    it('returns %j as [Circular] for circular objects', () => {
        const obj: Record<string, unknown> = {};
        obj.self = obj;
        expect(StringHelper.sprintf('%j', obj)).toBe('[Circular]');
    });

});