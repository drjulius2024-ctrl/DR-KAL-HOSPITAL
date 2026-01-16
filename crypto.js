import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text) {
    if (!text) return text;
    try {
        // Handle non-string inputs (like JSON objects)
        const stringVal = typeof text === 'object' ? JSON.stringify(text) : String(text);

        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(stringVal);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error("Encryption failed", e);
        return text;
    }
}

export function decrypt(text) {
    if (!text || typeof text !== 'string' || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        const encryptedHex = textParts.join(':');

        if (!ivHex || !encryptedHex) return text;

        const iv = Buffer.from(ivHex, 'hex');

        // Validation: AES-256-CBC IV must be 16 bytes
        if (iv.length !== 16) {
            // Assume it's just a normal string containing a colon
            return text;
        }

        const encryptedText = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        const str = decrypted.toString();
        // Try to parse JSON if it looks like one
        try {
            if (str.startsWith('{') || str.startsWith('[')) {
                return JSON.parse(str);
            }
        } catch { }

        return str;
    } catch (e) {
        // If decryption fails (e.g. bad key, bad data), return original text
        // console.error("Decryption failed", e.message); 
        return text;
    }
}
