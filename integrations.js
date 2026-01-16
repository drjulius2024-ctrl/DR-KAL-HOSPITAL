import { getConfig } from './global_sync';

// Webhook URLs (Placeholders for user to update)
const INTEGRATION_URLS = {
    ZAPIER: 'https://hooks.zapier.com/hooks/catch/EXAMPLE_ZAPIER_ID/',
    AIRTABLE: 'https://hooks.airtable.com/hooks/catch/EXAMPLE_AIRTABLE_ID/'
};

/**
 * Triggers a workflow on Zapier or Airtable via Webhooks
 * @param {string} destination - 'ZAPIER' or 'AIRTABLE'
 * @param {string} eventType - e.g., 'APPOINTMENT_BOOKED', 'RECORD_UPDATED'
 * @param {object} data - The payload to send
 * @param {string} [overrideUrl] - Optional URL to use instead of config (for testing)
 */
export const triggerWorkflow = async (destination, eventType, data, overrideUrl = null) => {
    // Check override, then config, then fallback to placeholders
    const config = getConfig() || {};
    const configKey = destination === 'ZAPIER' ? 'zapierWebhookUrl' : 'airtableWebhookUrl';
    const url = overrideUrl || config[configKey] || INTEGRATION_URLS[destination];

    if (!url || url.includes('EXAMPLE')) {
        console.warn(`[Integration] ${destination} URL not configured. Skipping webhook for ${eventType}.`);
        return;
    }

    const payload = {
        eventType,
        timestamp: new Date().toISOString(),
        ...data
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.log(`[Integration] Successfully triggered ${destination} workflow for ${eventType}`);
        return { success: true };
    } catch (error) {
        console.error(`[Integration] Error triggering ${destination} workflow:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Standardized function to trigger both Zapier and Airtable for specific events
 */
export const syncToExternalSystems = (eventType, data) => {
    // Determine which system to trigger based on event type
    if (eventType === 'APPOINTMENT_BOOKED') {
        triggerWorkflow('ZAPIER', eventType, data);
    }

    // Most actions by professionals go to Airtable for audit trail
    if (['RECORD_UPDATED', 'APPOINTMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PRESCRIPTION_ISSUED'].includes(eventType)) {
        triggerWorkflow('AIRTABLE', eventType, data);
    }
};
