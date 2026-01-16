
import { LocalAdapter } from './local-adapter';

// In future, import SupabaseAdapter here

const ADAPTERS = {
    LOCAL: 'local',
    SUPABASE: 'supabase',
    S3: 's3'
};

// Default to LOCAL if not configured
const CURRENT_ADAPTER = process.env.STORAGE_PROVIDER || ADAPTERS.LOCAL;

export const StorageManager = {
    async uploadFile(file) {
        switch (CURRENT_ADAPTER) {
            case ADAPTERS.LOCAL:
                return await LocalAdapter.upload(file);
            case ADAPTERS.SUPABASE:
                // return await SupabaseAdapter.upload(file);
                throw new Error("Supabase adapter not yet implemented");
            default:
                return await LocalAdapter.upload(file);
        }
    },

    async deleteFile(key) {
        switch (CURRENT_ADAPTER) {
            case ADAPTERS.LOCAL:
                return await LocalAdapter.delete(key);
            case ADAPTERS.SUPABASE:
                // return await SupabaseAdapter.delete(key);
                throw new Error("Supabase adapter not yet implemented");
            default:
                return await LocalAdapter.delete(key);
        }
    }
};
