import { PayloadCodec } from '@temporalio/common';
import { temporal } from '@temporalio/proto';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const METADATA_ENCODING = 'binary/encrypted';
const CIPHER = 'aes-256-gcm';
const METADATA_ENCRYPTION_CIPHER_KEY = 'encryption-cipher';
const METADATA_ENCRYPTION_KEY_ID_KEY = 'encryption-key-id';

export class CryptCodec implements PayloadCodec {
  async encode(payloads: temporal.api.common.v1.IPayload[]): Promise<temporal.api.common.v1.IPayload[]> {
    // Simulate codec processing delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return payloads.map(payload => this.encodePayload(payload));
  }

  async decode(payloads: temporal.api.common.v1.IPayload[]): Promise<temporal.api.common.v1.IPayload[]> {
    // Simulate codec processing delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return payloads.map(payload => this.decodePayload(payload));
  }

  private encodePayload(payload: temporal.api.common.v1.IPayload): temporal.api.common.v1.IPayload {
    const keyId = this.getKeyId();
    const key = this.getKey(keyId);
    
    const payloadBytes = temporal.api.common.v1.Payload.encode(payload).finish();
    const encryptedData = this.encrypt(payloadBytes, key);

    return {
      metadata: {
        encoding: Buffer.from(METADATA_ENCODING),
        [METADATA_ENCRYPTION_CIPHER_KEY]: Buffer.from(CIPHER),
        [METADATA_ENCRYPTION_KEY_ID_KEY]: Buffer.from(keyId),
      },
      data: encryptedData,
    };
  }

  private decodePayload(payload: temporal.api.common.v1.IPayload): temporal.api.common.v1.IPayload {
    const encoding = payload.metadata?.encoding?.toString();
    if (encoding === METADATA_ENCODING) {
      const keyId = payload.metadata?.[METADATA_ENCRYPTION_KEY_ID_KEY]?.toString();
      if (!keyId) throw new Error('Missing encryption key ID');
      
      const key = this.getKey(keyId);
      const plainData = this.decrypt(payload.data!, key);
      
      return temporal.api.common.v1.Payload.decode(plainData);
    }
    return payload;
  }

  private getKeyId(): string {
    return 'test-key-test-key-test-key-test!';
  }

  private getKey(keyId: string): Buffer {
    return Buffer.from(keyId, 'utf8').subarray(0, 32);
  }

  private encrypt(data: Uint8Array, key: Buffer): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([iv, tag, encrypted]);
  }

  private decrypt(encryptedData: Uint8Array, key: Buffer): Buffer {
    const buffer = Buffer.from(encryptedData);
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}