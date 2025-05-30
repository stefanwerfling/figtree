export declare class MerkleTreeRootHash {
    sha256(data: Buffer | string): Buffer;
    private _buildMerkleRoot;
    fromFile(filePath: string, chunkSize?: number): Promise<string>;
    fromFolder(dir: string, recursive: boolean): Promise<string>;
}
