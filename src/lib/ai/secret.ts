import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is not set. Set it in your environment before storing an AI provider API key."
    );
  }
  // Hash whatever string the admin sets down to exactly 32 bytes, so any
  // passphrase works rather than requiring a precisely-formatted key.
  return createHash("sha256").update(raw, "utf8").digest();
}

/** Encrypts a plaintext API key for storage in settings.json. */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${ciphertext.toString("base64")}:${authTag.toString("base64")}`;
}

/** Decrypts a secret produced by encryptSecret. Throws on tampering or a wrong/missing key. */
export function decryptSecret(stored: string): string {
  const [version, ivB64, ciphertextB64, authTagB64] = stored.split(":");
  if (version !== "v1" || !ivB64 || !ciphertextB64 || !authTagB64) {
    throw new Error("Unrecognized secret format");
  }
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.SETTINGS_ENCRYPTION_KEY);
}
