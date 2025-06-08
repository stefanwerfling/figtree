import path from 'path';
import { MerkleTreeRootHash } from '../Crypto/MerkleTreeRootHash.js';
export class CreatePluginHash {
    async exec() {
        const cwd = process.cwd();
        const sourceDir = path.join(cwd, 'dist');
        const mtrh = new MerkleTreeRootHash();
        const hash = await mtrh.fromFolder(sourceDir, true);
        console.log(`Your new hash for a figtree plugin is: ${hash}`);
    }
}
//# sourceMappingURL=CreatePluginHash.js.map