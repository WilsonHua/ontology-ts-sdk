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

import * as cryptoJS from 'crypto-js';
import * as elliptic from 'elliptic';
import { sha3_224, sha3_256, sha3_384, sha3_512} from 'js-sha3';
import { hexstr2str, hexstring2ab, StringReader } from '../utils';
import { DEFAULT_ALGORITHM } from '../consts';
import { KeyType } from './KeyType';
import { CurveLabel } from './CurveLabel';
import { SignatureSchema } from './SignatureSchema';

/**
 * Specific parameters for the key type.
 */
export class KeyParameters {
    curve: CurveLabel;

    constructor(curve: CurveLabel) {
        this.curve = curve;
    }

    serializeJson(): JsonKeyParameters {
        return {
            curve: this.curve.label
        };
    }

    static deserializeJson(json: JsonKeyParameters): KeyParameters {
        return new KeyParameters(
            CurveLabel.fromLabel(json.curve)
        );
    }
};

/**
 * Common representation of private or public key
 */
export class Key {
    /**
     * Algorithm used for key generation.
     */
    algorithm: KeyType;

    /**
     * Parameters of the algorithm.
     */
    parameters: KeyParameters;

    /**
     * Key data.
     */
    key: string;

    /**
     * Creates Key.
     * 
     * If no algorithm or parameters are specified, default values will be used. 
     * This is strongly discurraged, because it will forbid using other Key types.
     * Therefore use it only for testing.
     * 
     * @param key Hex encoded key value
     * @param algorithm Key type
     * @param parameters Parameters of the key type
     */
    constructor(key: string, algorithm?: KeyType, parameters?: KeyParameters) {
        this.key = key;

        if (algorithm === undefined) {
            algorithm = KeyType.fromLabel(DEFAULT_ALGORITHM.algorithm);
        }

        if (parameters === undefined) {
            parameters = KeyParameters.deserializeJson(DEFAULT_ALGORITHM.parameters);
        }

        this.algorithm = algorithm;
        this.parameters = parameters;
    }
    
    /**
     * Computes hash of message using hashing function of signature schema.
     * 
     * @param msg Hex encoded input data
     * @param schema Signing schema to use
     */
    computeHash(msg: string, schema: SignatureSchema): string {
        switch(schema) {
            case SignatureSchema.ECDSAwithSHA224:
                return cryptoJS.SHA224(cryptoJS.enc.Hex.parse(msg)).toString();
            case SignatureSchema.ECDSAwithSHA256:
                return cryptoJS.SHA256(cryptoJS.enc.Hex.parse(msg)).toString();
            case SignatureSchema.ECDSAwithSHA384:
                return cryptoJS.SHA384(cryptoJS.enc.Hex.parse(msg)).toString();
            case SignatureSchema.ECDSAwithSHA512:
            case SignatureSchema.EDDSAwithSHA512:
                return cryptoJS.SHA512(cryptoJS.enc.Hex.parse(msg)).toString();
            case SignatureSchema.ECDSAwithSHA3_224:
                return sha3_224(hexstring2ab(msg));
            case SignatureSchema.ECDSAwithSHA3_256:
                return sha3_256(hexstring2ab(msg));
            case SignatureSchema.ECDSAwithSHA3_384:
                return sha3_384(hexstring2ab(msg));
            case SignatureSchema.ECDSAwithSHA3_512:
                return sha3_512(hexstring2ab(msg));
            case SignatureSchema.ECDSAwithRIPEMD160:
                return cryptoJS.RIPEMD160(cryptoJS.enc.Hex.parse(msg)).toString();
            case SignatureSchema.SM2withSM3:
            default:
                throw new Error('Unsupported hash algorithm.');
        }
    }

    /**
     * Tests if signing schema is compatible with key type.
     * 
     * @param schema Signing schema to use
     */
    isSchemaSupported(schema: SignatureSchema): boolean {
        switch(schema) {
            case SignatureSchema.ECDSAwithSHA224:
            case SignatureSchema.ECDSAwithSHA256:
            case SignatureSchema.ECDSAwithSHA384:
            case SignatureSchema.ECDSAwithSHA512:
            case SignatureSchema.ECDSAwithSHA3_224:
            case SignatureSchema.ECDSAwithSHA3_256:
            case SignatureSchema.ECDSAwithSHA3_384:
            case SignatureSchema.ECDSAwithSHA3_512:
            case SignatureSchema.ECDSAwithRIPEMD160:
                return this.algorithm === KeyType.ECDSA;
            case SignatureSchema.EDDSAwithSHA512:
                return this.algorithm === KeyType.EDDSA;
            case SignatureSchema.SM2withSM3:
                return this.algorithm === KeyType.SM2;
            default:
                throw new Error('Unsupported signature schema.');
        }
    }

    /**
     * Gets JSON representation of the Key (Public/Private).
     */
    serializeJson(): JsonKey {
        return {
            algorithm: this.algorithm.label,
            parameters: this.parameters.serializeJson(),
            key: this.key
        };
    }
};

/**
 * Json representation of the Key.
 */
export interface JsonKey {
    algorithm: string;
    parameters: JsonKeyParameters;
    key: string;
};

/**
 * Json representation of the Key parameters.
 */
export interface JsonKeyParameters {
    curve: string;
};