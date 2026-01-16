
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const LocalAdapter = {
    async upload(file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure public/uploads exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${uuidv4()}${ext}`;
        const filePath = path.join(uploadDir, filename);

        // Write file
        fs.writeFileSync(filePath, buffer);

        // Return public URL
        return {
            url: `/uploads/${filename}`,
            key: filename, // For local, key is just filename
            provider: 'local'
        };
    },

    async delete(key) {
        const filePath = path.join(process.cwd(), 'public', 'uploads', key);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
};
