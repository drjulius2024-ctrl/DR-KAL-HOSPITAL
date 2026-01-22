"use client";
import { useState, useEffect } from 'react';
import { SYNC_EVENT } from '../global_sync';

export function useGlobalSync() {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const handleSync = () => setTick(t => t + 1);
        window.addEventListener(SYNC_EVENT, handleSync);
        window.addEventListener('storage', handleSync);

        // POLL SERVER for changes from other users
        const pollServer = async () => {
            try {
                const res = await fetch('/api/db');
                if (res.ok) {
                    const db = await res.json();
                    Object.keys(db).forEach(dbKey => {
                        let localKey = null;
                        if (dbKey === 'users') localKey = 'dr_kal_all_users';
                        else if (dbKey === 'email_logs') localKey = 'dr_kal_email_logs';
                        else if (dbKey === 'patient_profiles') localKey = 'dr_kal_patient_profiles';
                        else if (dbKey === 'activity_logs') localKey = 'dr_kal_activity';
                        else localKey = `dr_kal_${dbKey}`;

                        if (localKey) {
                            const distinctData = JSON.stringify(db[dbKey]);
                            const currentLocal = localStorage.getItem(localKey);
                            if (distinctData !== currentLocal) {
                                localStorage.setItem(localKey, distinctData);
                                window.dispatchEvent(new Event(SYNC_EVENT)); // Force UI Update
                                handleSync(); // Trigger re-render
                            }
                        }
                    });
                }
            } catch (e) {
                // Silent fail on poll error
            }
        };

        const interval = setInterval(pollServer, 2000);

        return () => {
            window.removeEventListener(SYNC_EVENT, handleSync);
            window.removeEventListener('storage', handleSync);
            clearInterval(interval);
        };
    }, []);

    return tick;
}
