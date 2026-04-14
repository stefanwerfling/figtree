import {describe, it, expect} from 'vitest';
import {BufferHelper} from '../../../src/Utils/BufferHelper.js';

describe('BufferHelper.splitBuffer', () => {

    it('splits buffer by string separator', () => {
        const buf = Buffer.from('hello|world|foo');
        const parts = BufferHelper.splitBuffer(buf, '|');
        expect(parts).toHaveLength(3);
        expect(parts[0]!.toString()).toBe('hello');
        expect(parts[1]!.toString()).toBe('world');
        expect(parts[2]!.toString()).toBe('foo');
    });

    it('splits buffer by buffer separator', () => {
        const buf = Buffer.from('a::b::c');
        const sep = Buffer.from('::');
        const parts = BufferHelper.splitBuffer(buf, sep);
        expect(parts).toHaveLength(3);
        expect(parts[0]!.toString()).toBe('a');
        expect(parts[1]!.toString()).toBe('b');
        expect(parts[2]!.toString()).toBe('c');
    });

    it('returns single element when separator not found', () => {
        const buf = Buffer.from('hello');
        const parts = BufferHelper.splitBuffer(buf, '|');
        expect(parts).toHaveLength(1);
        expect(parts[0]!.toString()).toBe('hello');
    });

    it('ignores empty segments between consecutive separators', () => {
        const buf = Buffer.from('a||b');
        const parts = BufferHelper.splitBuffer(buf, '|');
        expect(parts).toHaveLength(2);
        expect(parts[0]!.toString()).toBe('a');
        expect(parts[1]!.toString()).toBe('b');
    });

    it('returns empty array for empty buffer', () => {
        const buf = Buffer.from('');
        const parts = BufferHelper.splitBuffer(buf, '|');
        expect(parts).toHaveLength(0);
    });

});