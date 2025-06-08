import path from 'path';
import {MerkleTreeRootHash} from '../Crypto/MerkleTreeRootHash.js';

/**
 * Create Plugin Hash
 */
export class CreatePluginHash {

    /**
     * Exec
     */
    public async exec(): Promise<void> {
        const cwd = process.cwd();
        const sourceDir = path.join(cwd, 'dist');

        const mtrh = new MerkleTreeRootHash();
        const hash = await mtrh.fromFolder(sourceDir, true);

        console.log(`Your new hash for a figtree plugin is: ${hash}`);
    }

}