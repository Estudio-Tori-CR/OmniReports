import { createHmac } from "node:crypto";
import crypto from "crypto";

class Encript {
  public Hash(value: string): string {
    const secret = process.env.SECRET as string;
    const hash = createHmac("sha256", secret).update(value).digest("hex");

    return hash;
  }

  private getKey(): Buffer {
    const secret = process.env.SECRET;
    if (!secret)
      throw new Error("SECRET no está definido en variables de entorno.");

    return crypto.createHash("sha256").update(secret, "utf8").digest();
  }

  public encrypt(plainText: string): string {
    const key = this.getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const ciphertext = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return `${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
  }

  public decrypt(payload: string): string {
    const key = this.getKey();
    const parts = payload.split(":");
    if (parts.length !== 3)
      throw new Error("Payload inválido. Formato esperado iv:tag:ciphertext");

    const [ivB64, tagB64, dataB64] = parts;

    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    return plain.toString("utf8");
  }
}

export default Encript;
