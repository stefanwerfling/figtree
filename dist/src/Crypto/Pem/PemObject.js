import { PemError } from './PemError.js';
const rfc7468CompliantPEMLabels = [
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
export class PemObject {
    static preEncapsulationBoundaryRegex = /^-----BEGIN ([ \x21-\x7e]+)-----$/mu;
    static postEncapsulationBoundaryRegex = /^-----END ([ \x21-\x7e]+)-----$/mu;
    static base64LineRegex = /^[A-Za-z0-9+/=]+\s*$/mgu;
    static pemObjectRegex = new RegExp(`${PemObject.preEncapsulationBoundaryRegex.source}\r?\n(?:\\s*\r?\n)*((?:${PemObject.base64LineRegex.source}\r?\n)*)?${PemObject.postEncapsulationBoundaryRegex.source}`, 'mu');
    static validateLabel(label) {
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
    static parse(text) {
        let i = 0;
        let match;
        const ret = [];
        do {
            match = PemObject.pemObjectRegex.exec(text.slice(i));
            if (match === null) {
                break;
            }
            i += match.index + 1;
            const next = new PemObject(match[1], match[2].replace(/\s+/ug, ''));
            ret.push(next);
        } while (i < text.length);
        return ret;
    }
    _label = '';
    data = new Uint8Array(0);
    constructor(label, data) {
        if (label !== undefined) {
            this.setLabel(label);
        }
        if (data !== undefined) {
            if (typeof data === 'string') {
                this.data = Buffer.from(data, 'base64');
            }
            else {
                this.data = data;
            }
        }
    }
    getLabel() {
        PemObject.validateLabel(this._label);
        return this._label;
    }
    setLabel(value) {
        PemObject.validateLabel(value);
        this._label = value;
    }
    hasRFC7468CompliantLabel() {
        return rfc7468CompliantPEMLabels.includes(this._label);
    }
    getPreEncapsulationBoundary() {
        return `-----BEGIN ${this._label}-----`;
    }
    getPostEncapsulationBoundary() {
        return `-----END ${this._label}-----`;
    }
    getEncapsulatedTextPortion() {
        const base64data = Buffer.from(this.data).toString('base64');
        const stringSplitter = /.{1,64}/gu;
        return (base64data.match(stringSplitter) || []).join('\n');
    }
    encoded() {
        return (`${this.getPreEncapsulationBoundary()}\n${this.getEncapsulatedTextPortion()}\n${this.getPostEncapsulationBoundary()}`);
    }
    decode(encoded) {
        const lines = encoded.trim().replace('\r', '').split('\n');
        if (lines.length <= 2) {
            throw new PemError('PEM is too small to be valid');
        }
        if (lines[0].indexOf('-----BEGIN ') !== 0) {
            throw new PemError('PEM object did not start with \'-----BEGIN \'');
        }
        if (!lines[0].endsWith('-----')) {
            throw new PemError('PEM object did not end with \'-----\'');
        }
        const preEncapsulationBoundaryLabel = lines[0].slice(11, lines[0].length - 5);
        if (lines[lines.length - 1].indexOf('-----END ') !== 0) {
            throw new PemError('Last line of PEM object did not start with \'-----END \'');
        }
        if (!lines[lines.length - 1].endsWith('-----')) {
            throw new PemError('Last line of PEM object did not end with \'-----\'');
        }
        const postEncapsulationBoundaryLabel = lines[lines.length - 1].slice(9, lines[lines.length - 1].length - 5);
        if (preEncapsulationBoundaryLabel !== postEncapsulationBoundaryLabel) {
            throw new PemError('PEM object Pre-encapsulation Boundary label does not match Post-encapsulation Boundary label.');
        }
        this._label = preEncapsulationBoundaryLabel;
        let firstNonBlankBase64Line = 1;
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
        const base64data = lines.slice(1, lines.length - 1).join('').replace(/\s+/gu, '');
        this.data = Buffer.from(base64data, 'base64');
    }
}
//# sourceMappingURL=PemObject.js.map