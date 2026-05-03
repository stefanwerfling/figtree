import * as fs from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { DirHelper } from '../Utils/DirHelper.js';
export class MerkleTreeRootHash {
    sha256(data) {
        return createHash('sha256').update(data).digest();
    }
    _buildMerkleRoot(hashes) {
        if (hashes.length === 0) {
            throw new Error('Empty input: none chunks given.');
        }
        let level = hashes;
        while (level.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = i + 1 < level.length ? level[i + 1] : left;
                nextLevel.push(this.sha256(Buffer.concat([left, right])));
            }
            level = nextLevel;
        }
        return level[0];
    }
    async fromFile(filePath, chunkSize = 1024 * 1024) {
        return new Promise((resolve, reject) => {
            const chunkHashes = [];
            const stream = fs.createReadStream(filePath, {
                highWaterMark: chunkSize
            });
            stream.on('data', (chunk) => {
                if (!Buffer.isBuffer(chunk)) {
                    throw new Error('Chunk is not a Buffer');
                }
                const hash = this.sha256(chunk);
                chunkHashes.push(hash);
            });
            stream.on('end', () => {
                const root = this._buildMerkleRoot(chunkHashes);
                resolve(root.toString('hex'));
            });
            stream.on('error', reject);
        });
    }
    async fromFolder(dir, recursive) {
        const filePaths = await DirHelper.getFiles(dir, recursive);
        filePaths.sort();
        const fileHashes = await Promise.all(filePaths.map(async (relativePath) => {
            const absPath = path.join(dir, relativePath);
            const fileHash = await this.fromFile(absPath);
            return this.sha256(Buffer.concat([
                Buffer.from(relativePath, 'utf8'),
                Buffer.from(fileHash, 'hex')
            ]));
        }));
        const folderHash = this._buildMerkleRoot(fileHashes);
        return folderHash.toString('hex');
    }
}
//# sourceMappingURL=MerkleTreeRootHash.js.map