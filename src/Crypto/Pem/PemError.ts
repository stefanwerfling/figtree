/**
 * Pem Error object
 */
export class PemError extends Error {

    /**
     * Constructor for PemError
     * @param {string} msg
     */
    public constructor(msg: string) {
        super(msg);
    }

}