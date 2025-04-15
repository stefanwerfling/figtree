import {PemError} from './PemError.js';

const rfc7468CompliantPEMLabels: string[] = [
    'X509 CERTIFICATE',
    'CERTIFICATE',
    'CERTIFICATE PAIR',
    'TRUSTED CERTIFICATE',
    'NEW CERTIFICATE REQUEST',
    'CERTIFICATE REQUEST',
    'X509 CRL',
    'ANY PRIVATE KEY',
    'PUBLIC KEY',
    'RSA PRIVATE KEY',
    'RSA PUBLIC KEY',
    'DSA PRIVATE KEY',
    'DSA PUBLIC KEY',
    'PKCS7',
    'PKCS #7 SIGNED DATA',
    'ENCRYPTED PRIVATE KEY',
    'PRIVATE KEY',
    'DH PARAMETERS',
    'SSL SESSION PARAMETERS',
    'DSA PARAMETERS',
    'ECDSA PUBLIC KEY',
    'EC PARAMETERS',
    'EC PRIVATE KEY',
    'PARAMETERS',
    'CMS',
    'ATTRIBUTE CERTIFICATE',
];

/**
 * PemObject checking PEM-Strings
 * The orginale source by: https://github.com/JonathanWilbur/pem-ts/tree/master
 */
export class PemObject {

    public static readonly preEncapsulationBoundaryRegex: RegExp = /^-----BEGIN ([ \x21-\x7e]+)-----$/mu;
    public static readonly postEncapsulationBoundaryRegex: RegExp = /^-----END ([ \x21-\x7e]+)-----$/mu;
    public static readonly base64LineRegex: RegExp = /^[A-Za-z0-9+/=]+\s*$/mgu;
    public static readonly pemObjectRegex: RegExp = new RegExp(
        `${
            PemObject.preEncapsulationBoundaryRegex.source
        }\r?\n(?:\\s*\r?\n)*((?:${
            PemObject.base64LineRegex.source
        }\r?\n)*)?${
            PemObject.postEncapsulationBoundaryRegex.source
        }`,
        'mu',
    );

    /**
     * From RFC 7468:
     * "Labels are formally case-sensitive, uppercase, and comprised of zero or more
     * characters; they do not contain consecutive spaces or hyphen-minuses,
     * nor do they contain spaces or hyphen-minuses at either end."
     * @param {string} label
     * @throws {PemError}
     */
    public static validateLabel(label: string): void {
        if (!label.match(/^[A-Z#0-9 ]*$/u)) {
            throw new PemError('Malformed PEM label.');
        }

        if (label.match(/\s\s/u)) {
            throw new PemError('PEM label cannot contain consecutive spaces.');
        }

        if (label.match(/--/u)) {
            throw new PemError('PEM label cannot contain consecutive hyphen-minuses.');
        }

        if (label.match(/^\s+/u) || label.match(/\s+$/u)) {
            throw new PemError('PEM label cannot begin or end with spaces.');
        }

        if (label.match(/^-+/u) || label.match(/-+$/u)) {
            throw new PemError('PEM label cannot begin or end with hyphen-minuses.');
        }
    }

    /**
     * Parse a pem string to PemObject
     * @param {string} text
     * @throws {PemError}
     * @returns {PemObject}
     */
    public static parse(text: string): PemObject[] {
        let i: number = 0;
        let match: RegExpExecArray | null;
        const ret: PemObject[] = [];

        do {
            match = PemObject.pemObjectRegex.exec(text.slice(i));
            if (match === null) {
                break;
            }

            // "+ match[0].length" does not work for some reason.
            i += match.index + 1;

            const next: PemObject = new PemObject(
                match[1],
                match[2].replace(/\s+/ug, '')
            );

            ret.push(next);
        } while (i < text.length);

        return ret;
    }

    /**
     * Label from PEM String
     * @private
     */
    private _label: string = '';

    /**
     * PEM data
     */
    public data: Uint8Array = new Uint8Array(0);

    /**
     *
     * @param {string} label
     * @param {string | Uint8Array} data
     * @throws {PemError}
     */
    public constructor(label?: string, data?: string | Uint8Array) {
        if (label !== undefined) {
            this.setLabel(label);
        }

        if (data !== undefined) {
            if (typeof data === 'string') {
                this.data = Buffer.from(data, 'base64');
            } else {
                this.data = data;
            }
        }
    }

    /**
     * Return the label in PEM String
     * @throws {PemError}
     * @returns {string}
     */
    public getLabel(): string {
        PemObject.validateLabel(this._label);
        return this._label;
    }

    /**
     * Set the label from/for PEM
     * @param {string} value
     * @throws {PemError}
     */
    public setLabel(value: string): void {
        PemObject.validateLabel(value);
        this._label = value;
    }

    public hasRFC7468CompliantLabel(): boolean {
        // You don't really have to validate it in this case, so _label is used.
        return rfc7468CompliantPEMLabels.includes(this._label);
    }

    /**
     * Return pre-encapsulation boundary
     * @returns {string}
     */
    public getPreEncapsulationBoundary(): string {
        return `-----BEGIN ${this._label}-----`;
    }

    /**
     * Return post-encapsulation boundary
     * @returns {string}
     */
    public getPostEncapsulationBoundary(): string {
        return `-----END ${this._label}-----`;
    }

    /**
     * Return an encapsulated text portion
     * @returns {string}
     */
    public getEncapsulatedTextPortion(): string {
        const base64data: string = Buffer.from(this.data).toString('base64');
        const stringSplitter: RegExp = /.{1,64}/gu;
        return (base64data.match(stringSplitter) || []).join('\n');
    }

    /**
     * Return the encoded string
     * @returns {string}
     */
    public encoded(): string {
        return (
            `${
                this.getPreEncapsulationBoundary()
            }\n${
                this.getEncapsulatedTextPortion()
            }\n${
                this.getPostEncapsulationBoundary()
            }`
        );
    }

    /**
     * Decode a PEM string
     * @param {string} encoded
     * @throws {PemError}
     */
    public decode(encoded: string): void {
        const lines: string[] = encoded.trim().replace('\r', '').split('\n');

        if (lines.length <= 2) {
            throw new PemError('PEM is too small to be valid');
        }

        // Pre-encapsulation Boundary parsing
        if (lines[0].indexOf('-----BEGIN ') !== 0) {
            throw new PemError('PEM object did not start with \'-----BEGIN \'');
        }

        if (!lines[0].endsWith('-----')) {
            throw new PemError('PEM object did not end with \'-----\'');
        }

        const preEncapsulationBoundaryLabel: string = lines[0].slice(11, lines[0].length - 5);

        // Post-encapsulation Boundary parsing
        if (lines[lines.length - 1].indexOf('-----END ') !== 0) {
            throw new PemError('Last line of PEM object did not start with \'-----END \'');
        }

        if (!lines[lines.length - 1].endsWith('-----')) {
            throw new PemError('Last line of PEM object did not end with \'-----\'');
        }
        const postEncapsulationBoundaryLabel: string
            = lines[lines.length - 1].slice(9, lines[lines.length - 1].length - 5);

        /**
         * From RFC 7468:
         * "Parsers MAY disregard the label in the post-encapsulation boundary
         * instead of signaling an error if there is a label mismatch: some
         * extant implementations require the labels to match; others do not."
         *
         * This library will not skip this validation, for now, though it is
         * permissible to do so in the future.
         */
        if (preEncapsulationBoundaryLabel !== postEncapsulationBoundaryLabel) {
            throw new PemError(
                'PEM object Pre-encapsulation Boundary label does not match Post-encapsulation Boundary label.',
            );
        }

        this._label = preEncapsulationBoundaryLabel;

        /**
         * From RFC 7468:
         * "Empty space can appear between the pre-encapsulation boundary and
         * the base64..."
         */
        let firstNonBlankBase64Line: number = 1;

        while (firstNonBlankBase64Line < (lines.length - 1)) {
            if (!lines[firstNonBlankBase64Line].match(/^\s*$/u)) {
                break;
            }

            firstNonBlankBase64Line++;
        }

        lines.slice(firstNonBlankBase64Line, lines.length - 1).forEach((line) => {
            if (line.match(/^\s*$/u)) {
                throw new PemError('Blank lines detected within PEM data');
            }
        });

        const base64data: string = lines.slice(1, lines.length - 1).join('').replace(/\s+/gu, '');
        this.data = Buffer.from(base64data, 'base64');
    }

}