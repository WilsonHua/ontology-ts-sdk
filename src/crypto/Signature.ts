/*
 * Copyright (C) 2018 The ontology Authors
 * This file is part of The ontology library.
 *
 * The ontology is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The ontology is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with The ontology.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as b64 from 'base64-url';
import { DEFAULT_SM2_ID } from '../consts';
import { num2hexstring, str2hexstr, StringReader } from '../utils';
import { SignatureScheme } from './SignatureScheme';

/**
 * Signature generated by signing data with Private Key.
 */
export class Signature {
    static deserializeJWT(encoded: string, algorithm: SignatureScheme, publicKeyId: string): Signature {
        const decoded = b64.decode(encoded, 'hex');

        return new Signature(
        algorithm,
        decoded,
        publicKeyId
        );
    }

    static deserializePgp(pgpSignature: PgpSignature): Signature {
        const value = new Buffer(pgpSignature.Value, 'base64').toString('hex');
        const deserialzedValue = Signature.deserializeHex(value).value;
        return new Signature(
        SignatureScheme.fromLabel(pgpSignature.Algorithm),
            deserialzedValue
        );
    }

    /**
     * Deserializes hex representation to Signature
     * @param data hex string
     */
    static deserializeHex(data: string): Signature {
        if (data.length < 4) {
            throw new Error('Invalid params.');
        }
        const sr = new StringReader(data);
        const scheme = parseInt(sr.read(1), 16);
        const sigScheme = SignatureScheme.fromHex(scheme);
        let value = '';
        if (sigScheme === SignatureScheme.SM2withSM3) {
            let i = 0;
            while (!sr.isEmpty() && parseInt(sr.read(1), 16) !== 0) {
                i++;
            }
            if (sr.isEmpty()) {
                throw new Error('Invalid params.');
            }
            value = data.substr(i * 2);
        } else {
            value = data.substr(2);
        }
        const sig = new Signature(sigScheme, value);
        return sig;
    }

    algorithm: SignatureScheme;
    value: string;

    /**
     * Public key Id used for create this signature.
     *
     */
    publicKeyId?: string;

    constructor(algorithm: SignatureScheme, value: string, publicKeyId?: string) {
        this.algorithm = algorithm;
        this.value = value;
        this.publicKeyId = publicKeyId;
    }

    /**
     * Serializes signature to Hex representation.
     * For transfer to java backend and verify it.
     */
    serializeHex(): string {
        // return num2hexstring(this.algorithm.hex) + this.value;
        let result = '';
        result += num2hexstring(this.algorithm.hex);
        if (this.algorithm === SignatureScheme.SM2withSM3) {
            result += str2hexstr(DEFAULT_SM2_ID);
            result += num2hexstring(0);
        }
        result += this.value;
        return result;

    }

    /**
     * Serializes signature to PGP representation with optional PublicKeyId.
     *
     * @param keyId Whole Public Key Id in the form <ONTID>#keys-<id>
     */
    serializePgp(keyId?: string): PgpSignature {
        const encoded = new Buffer(this.serializeHex(), 'hex').toString('base64');
        return {
            PublicKeyId: keyId,
            Format: 'pgp',
            Value: encoded,
            Algorithm: this.algorithm.label
        };
    }

    /**
     * Serializes signature to base64url format.
     */
    serializeJWT(): string {
        return b64.encode(this.value, 'hex');
    }
}

/**
 * PGP representation of the signature with embedded KeyId
 */
export interface PgpSignature {
    PublicKeyId?: string;
    Format: 'pgp';
    Algorithm: string;
    Value: string;
}
