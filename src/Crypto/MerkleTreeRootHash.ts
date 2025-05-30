import * as fs from "fs";
import { createHash } from "crypto";
import * as path from "path";
import {DirHelper} from '../Utils/DirHelper.js';

/**
 * MerkleTreeRootHash
 */
export class MerkleTreeRootHash {

    /**
     * Create a sha256 for a buffer
     * @param {Buffer|string} data
     * @return {buffer}
     */
    public sha256(data: Buffer|string): Buffer {
        return createHash('sha256').update(data).digest();
    }

    /**
     * Build merkle root
     * @param {Buffer[]} hashes
     * @return {Buffer}
     * @private
     */
    private _buildMerkleRoot(hashes: Buffer[]): Buffer {
        if (hashes.length === 0) {
            throw new Error('Empty input: none chunks given.');
        }

        while (hashes.length > 1) {
            const nextLevel: Buffer[] = [];

            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = i + 1 < hashes.length ? hashes[i + 1] : left;

                nextLevel.push(this.sha256(Buffer.concat([left, right])));
            }

            hashes = nextLevel;
        }

        return hashes[0];
    }

    /**
     * Build a hash from file
     * @param {string} filePath
     * @param {number} chunkSize
     * @return {string}
     */
    public async fromFile(filePath: string, chunkSize: number = 1024 * 1024): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunkHashes: Buffer[] = [];
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

    /**
     * Build a hash from folder
     * @param {string} dir
     * @param {boolean} recursive
     * @return {string}
     */
    public async fromFolder(dir: string, recursive: boolean): Promise<string> {
        const filePaths = await DirHelper.getFiles(dir, recursive);
        filePaths.sort();

        const fileHashes: Buffer[] = [];

        for (const relativePath of filePaths) {
            const absPath = path.join(dir, relativePath);
            const fileHash = await this.fromFile(absPath);
            const combined = this.sha256(Buffer.concat([
                Buffer.from(relativePath, 'utf8'),
                Buffer.from(fileHash, 'hex')
            ]));

            fileHashes.push(combined);
        }

        const folderHash = this._buildMerkleRoot(fileHashes);
        return folderHash.toString('hex');
    }

}