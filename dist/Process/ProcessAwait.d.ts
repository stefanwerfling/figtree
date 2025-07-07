import { ChildProcessWithoutNullStreams } from 'child_process';
export declare class ProcessAwait {
    static process(process: ChildProcessWithoutNullStreams): Promise<void>;
}
