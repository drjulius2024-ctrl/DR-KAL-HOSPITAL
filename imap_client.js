const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

async function fetchEmails(limit = 20) {
    const config = {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASS, // App Password
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 3000
        }
    };

    try {
        const connection = await imap.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false,
            struct: true
        };

        // Fetch latest 'limit' messages
        // IMAP doesn't support "limit" easily in search, so we search all and slice, 
        // OR calculate sequence numbers if we want to be efficient. 
        // For simplicity with imap-simple, let's just get the last N messages by sequence number logic if possible, 
        // but search(['ALL']) returns all IDs. 
        // A better approach for speed:

        // standard imap search returns all UIDs.
        const messages = await connection.search(searchCriteria, fetchOptions);

        // Sort by date (descending) and slice
        // Note: 'messages' here helps, but 'search' downloads them based on bodies.
        // Downloading ALL bodies is slow.
        // Let's refine: search first, then fetch bodies of the last N.

        // Re-implementing for efficiency:
    } catch (e) {
        console.error("IMAP Connection Error:", e);
        throw e;
    }
}

// Let's rewrite the export to be cleaner and efficient
module.exports = {
    getLatestEmails: async (limit = 20) => {
        const config = {
            imap: {
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASS,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                authTimeout: 10000
            }
        };

        try {
            const connection = await imap.connect(config);
            await connection.openBox('INBOX');

            // Get total message count
            // Note: imap-simple openBox returns box details
            // but connection.openBox() implementation helps.
            // Let's just use a delay fetch: 
            // 1. Search for last N UIDs is complex without box info.
            // Let's just fetch everything for now (prototype) but restrict existing search.
            // Actually, we can use searchCriteria = [['1:10']] for sequence numbers if we knew the total.

            // Simplified: Fetch headers of all (fast) then details of top 20? 
            // Or just delay-fetch:
            const searchCriteria = ['ALL'];
            const fetchOptions = {
                bodies: ['HEADER'], // minimal
                struct: true
            };

            const allMessages = await connection.search(searchCriteria, fetchOptions);
            // Sort by ID or Date
            const sorted = allMessages.sort((a, b) => b.attributes.uid - a.attributes.uid).slice(0, limit);

            // Now fetch full bodies for these few
            // Actually, mapped fetch is hard with imap-simple without re-query.
            // Better approach: just fetch recent by date or use '1:*' if we can.

            // Let's stick to "fetch all headers" -> sort -> return for list. 
            // Start simple.

            const results = await Promise.all(sorted.map(async (msg) => {
                const headerPart = msg.parts.find(part => part.which === 'HEADER');
                const subject = headerPart.body.subject?.[0] || '(No Subject)';
                const from = headerPart.body.from?.[0] || '(Unknown)';
                const date = headerPart.body.date?.[0] || new Date().toISOString();

                // For body preview, we need to fetch specific parts, which typical search didn't get if we only asked for HEADER.
                // Re-fetching body part...
                // Ideally we use mailparser on the source.

                return {
                    id: msg.attributes.uid,
                    subject,
                    from,
                    date,
                    snippet: "Loading..." // Body requires more bandwidth
                };
            }));

            connection.end();
            return results;
        } catch (error) {
            console.error(error);
            return []; // Fail gracefully
        }
    },

    // Robust Fetcher
    getInbox: async (limit = 15) => {
        const config = {
            imap: {
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASS,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 15000
            }
        };

        try {
            const connection = await imap.connect(config);
            await connection.openBox('INBOX');

            // 1. Efficiently search for all UIDs and basic headers to sort
            const searchCriteria = ['ALL'];
            const fetchOptions = {
                bodies: ['HEADER.FIELDS (DATE SUBJECT FROM)'],
                struct: false
            };

            // Fetch headers only first
            const allMessages = await connection.search(searchCriteria, fetchOptions);

            // 2. Sort descending by UID (proxy for date) or Date
            const sorted = allMessages.sort((a, b) => {
                return b.attributes.uid - a.attributes.uid;
            }).slice(0, limit);

            // 3. Fetch full bodies ONLY for the top N
            if (sorted.length === 0) {
                connection.end();
                return [];
            }

            // To fetch robustly, we need individual fetches (safer than batch UID which imap-simple can do but is tricky)
            // Or just a SEARCH UID ...

            const uidsToFetch = sorted.map(m => m.attributes.uid);
            // imap-simple usage: search([['UID', ...uids]])
            const bodyFetchCriteria = [['UID', ...uidsToFetch]];

            const fullMessages = await connection.search(bodyFetchCriteria, { bodies: [''], markSeen: false });

            // Parse them
            const parsed = await Promise.all(fullMessages.map(async (item) => {
                try {
                    const allPart = item.parts.find(p => p.which === '');
                    const rawSource = allPart ? allPart.body : '';
                    const parsedMail = await simpleParser(rawSource);

                    return {
                        id: item.attributes.uid,
                        seq: item.seqNo,
                        from: parsedMail.from?.text || 'Unknown',
                        fromAddress: parsedMail.from?.value?.[0]?.address || '',
                        subject: parsedMail.subject || '(No Subject)',
                        date: parsedMail.date || new Date(),
                        body: parsedMail.text || '',
                        html: parsedMail.html || parsedMail.textAsHtml || parsedMail.text
                    };
                } catch (err) {
                    return { id: item.attributes.uid, subject: 'Error parsing', body: '' };
                }
            }));

            // Sort again because search return order is undefined
            parsed.sort((a, b) => b.id - a.id);

            connection.end();
            return parsed;
        } catch (e) {
            console.error("Inbox Fetch Error:", e);
            return [];
        }
    },

    deleteEmail: async (uid) => {
        const config = {
            imap: {
                user: process.env.EMAIL_USER,
                password: process.env.EMAIL_PASS,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };
        try {
            const connection = await imap.connect(config);
            await connection.openBox('INBOX');

            // For Gmail, we move to trash
            // UID is safer
            await connection.moveMessage(uid, '[Gmail]/Trash');

            connection.end();
            return { success: true };
        } catch (e) {
            console.error("Delete Error:", e);
            return { success: false, error: e.message };
        }
    }
};
