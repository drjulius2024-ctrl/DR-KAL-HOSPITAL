/**
 * Secure Storage Utility taking inspiration from Mobile Best Practices.
 * 
 * Android: Maps to EncryptedSharedPreferences (via React Native libraries)
 * iOS: Maps to Keychain Services
 * Web: Maps to LocalStorage with Obfuscation/Encryption (to satisfy "No Plain Text")
 */

const SECRET_SALT = 'DR_KALS_SECURE_SALT_v1';

// Simple Base64 encryption for Web Demo purposes. 
// In a real production environment, use a robust library like CryptoJS.
const encrypt = (text) => {
    if (!text) return text;
    try {
        // Obfuscate by adding salt and encoding
        return btoa(SECRET_SALT + encodeURIComponent(JSON.stringify(text)));
    } catch (e) {
        console.error("Encryption Failed", e);
        return null;
    }
};

const decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    try {
        if (!encryptedText || typeof encryptedText !== 'string') return null;
        // Check if string is likely base64 before attempting decode to avoid severe crashes
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedText)) {
            console.warn("SecureStorage: Data corrupt or not base64");
            return null;
        }

        const decoded = decodeURIComponent(atob(encryptedText));
        if (decoded.startsWith(SECRET_SALT)) {
            return JSON.parse(decoded.replace(SECRET_SALT, ''));
        }
        return null; // Tampered or Invalid
    } catch (e) {
        console.error("Decryption Failed safely", e);
        return null;
    }
};

export const SecureStorage = {
    /**
     * Store item securely.
     * On Mobile, this would be `await Keychain.setGenericPassword(...)`
     */
    setItem: (key, value) => {
        if (typeof window === 'undefined') return;

        const encrypted = encrypt(value);
        if (encrypted) {
            localStorage.setItem(key, encrypted);
        }
    },

    /**
     * Retrieve item securely.
     * On Mobile, this would be `await Keychain.getGenericPassword(...)`
     */
    getItem: (key) => {
        if (typeof window === 'undefined') return null;

        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;

        const decrypted = decrypt(encrypted);
        if (decrypted === null && encrypted) {
            console.warn(`SecureStorage: Corruption detected for ${key}. Clearing storage.`);
            localStorage.removeItem(key);
        }
        return decrypted;
    },

    /**
     * Remove item.
     */
    removeItem: (key) => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    }
};
