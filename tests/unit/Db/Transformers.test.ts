import {describe, it, expect} from 'vitest';
import {ZeroPadding15Transformer} from '../../../src/Db/MariaDb/Transformers/ZeroPaddingTransformer.js';
import {BoolTransformer} from '../../../src/Db/MariaDb/Transformers/BoolTransformer.js';
import {DecimalTransformer} from '../../../src/Db/MariaDb/Transformers/DecimalTransformer.js';
import {IntTransformer} from '../../../src/Db/MariaDb/Transformers/IntTransformer.js';

// ---- ZeroPadding15Transformer -----------------------------------------------

describe('ZeroPadding15Transformer', () => {
    const t = new ZeroPadding15Transformer();

    it('to: pads value to 15 characters', () => {
        expect(t.to('42')).toBe('000000000000042');
    });

    it('to: returns null for null input', () => {
        expect(t.to(null)).toBeNull();
    });

    it('from: strips leading zeros', () => {
        expect(t.from('000000000000042')).toBe('42');
    });

    it('from: returns empty string for all-zeros', () => {
        expect(t.from('000000000000000')).toBe('');
    });

    it('from: returns null for null input', () => {
        expect(t.from(null)).toBeNull();
    });
});

// ---- BoolTransformer --------------------------------------------------------

describe('BoolTransformer', () => {
    const t = new BoolTransformer();

    it('from: true boolean → true', () => expect(t.from(true)).toBe(true));
    it('from: false boolean → false', () => expect(t.from(false)).toBe(false));
    it('from: number 1 → true', () => expect(t.from(1)).toBe(true));
    it('from: number 0 → false', () => expect(t.from(0)).toBe(false));
    it('from: unknown value → false', () => expect(t.from('yes')).toBe(false));

    it('to: true → 1', () => expect(t.to(true)).toBe(1));
    it('to: false → 0', () => expect(t.to(false)).toBe(0));
    it('to: number 1 → 1', () => expect(t.to(1)).toBe(1));
    it('to: number 0 → 0', () => expect(t.to(0)).toBe(0));
    it('to: unknown value → 0', () => expect(t.to('yes')).toBe(0));
});

// ---- DecimalTransformer -----------------------------------------------------

describe('DecimalTransformer', () => {
    const t = new DecimalTransformer();

    it('to: string "3.14" → 3.14', () => expect(t.to('3.14')).toBe(3.14));
    it('to: invalid string → 0', () => expect(t.to('abc')).toBe(0));

    it('from: number → string', () => expect(t.from(3.14)).toBe('3.14'));
    it('from: null → empty string', () => expect(t.from(null)).toBe(''));
});

// ---- IntTransformer ---------------------------------------------------------

describe('IntTransformer', () => {
    const t = new IntTransformer();

    it('from: null → null', () => expect(t.from(null)).toBeNull());
    it('from: string → string', () => expect(t.from('99')).toBe('99'));
    it('from: number → string', () => expect(t.from(42)).toBe('42'));
    it('from: incompatible type → throws', () => expect(() => t.from({})).toThrow());

    it('to: null → null', () => expect(t.to(null)).toBeNull());
    it('to: number → number', () => expect(t.to(7)).toBe(7));
    it('to: numeric string → number', () => expect(t.to('5')).toBe(5));
    it('to: incompatible type → throws', () => expect(() => t.to({})).toThrow());
});