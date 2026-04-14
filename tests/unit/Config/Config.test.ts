import {describe, it, expect, beforeEach} from 'vitest';
import {Config} from '../../../src/Config/Config.js';
import {Vts} from 'vts';

// minimal valid schema
const TestSchema = Vts.object({
    name: Vts.string()
});

describe('Config.load', () => {

    beforeEach(() => {
        // reset singleton between tests
        (Config as any)._instance = null;
    });

    it('returns null when schema is not an ObjectSchema', async() => {
        const config = new (Config as any)(null);
        const result = await config.load('/tmp/nonexistent.json');
        expect(result).toBeNull();
    });

    it('returns null when config file does not exist', async() => {
        const config = new (Config as any)(TestSchema);
        const result = await config.load('/tmp/figtree_nonexistent_test.json');
        expect(result).toBeNull();
    });

    it('returns null when config file fails schema validation', async() => {
        const {writeFileSync, unlinkSync} = await import('node:fs');
        const path = '/tmp/figtree_invalid_config_test.json';

        writeFileSync(path, JSON.stringify({invalid: true}));

        const config = new (Config as any)(TestSchema);
        const result = await config.load(path);

        unlinkSync(path);
        expect(result).toBeNull();
    });

    it('returns config when file is valid', async() => {
        const {writeFileSync, unlinkSync} = await import('node:fs');
        const path = '/tmp/figtree_valid_config_test.json';

        writeFileSync(path, JSON.stringify({name: 'test'}));

        const config = new (Config as any)(TestSchema);
        const result = await config.load(path);

        unlinkSync(path);
        expect(result).toEqual({name: 'test'});
    });

});