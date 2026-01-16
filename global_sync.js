"use client";
import { syncToExternalSystems } from './integrations';
import { getSocket } from './socket';

// Keys for LocalStorage
export const KEYS = {
    RECORDS: 'dr_kal_global_records',
    PRESCRIPTIONS: 'dr_kal_prescriptions',
    VITALS: 'dr_kal_vitals',
    MESSAGES: 'dr_kal_messages',
    TASKS: 'dr_kal_tasks',
    PATIENT_PROFILES: 'dr_kal_patient_profiles',
    APPOINTMENTS: 'dr_kal_appointments',
    NOTIFICATIONS: 'dr_kal_notifications',
    ACTIVITY: 'dr_kal_activity',
    CONFIG: 'dr_kal_config',
    EMAIL_LOGS: 'dr_kal_email_logs',
    AUDIT: 'dr_kal_audit_logs'
};

// Helper to push changes to Server DB
const syncToServer = async (collection, action, item, id, updates) => {
    try {
        await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection, action, item, id, updates })
        });
    } catch (e) {
        console.error("Server Write Failed", e);
    }
};

export const updatePrescription = (rxId, updates) => {
    if (typeof window === 'undefined') return;
    const prescriptions = JSON.parse(localStorage.getItem(KEYS.PRESCRIPTIONS) || '[]');
    let updatedRx = null;
    const updated = prescriptions.map(rx => {
        if (rx.id === rxId) {
            updatedRx = { ...rx, ...updates };
            return updatedRx;
        }
        return rx;
    });
    localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(updated));

    if (updatedRx && updates.status) {
        // External Sync & Activity Log
        syncToExternalSystems('PRESCRIPTION_UPDATED', {
            rxId,
            status: updates.status,
            patientId: updatedRx.patientId
        });

        logAudit({
            actorName: updates.updatedBy || 'Staff',
            action: 'DISPATCHED PRESCRIPTION',
            targetName: `Prescription #${rxId}`,
            details: `Updated status to "${updates.status}"`,
            notes: JSON.stringify({ rxId, status: updates.status })
        });

        // Internal Alert for Doctors
        addNotification({
            recipientId: 'DOCTOR',
            professionalName: 'Doctor',
            type: 'PRESCRIPTION_UPDATED',
            title: 'Prescription Status Updated',
            message: `Pharmacist ${updates.updatedBy || 'Staff'} updated status of RX-${rxId} to "${updates.status}".`,
            details: { rxId, status: updates.status, patientId: updatedRx.patientId }
        });
    }

    dispatchSync();
    return updatedRx;
};

export const deleteAppointment = (id) => {
    if (typeof window === 'undefined') return;
    const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    const appointmentToDelete = appointments.find(a => a.id === id);

    if (appointmentToDelete) {
        const filteredAppointments = appointments.filter(a => a.id !== id);
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(filteredAppointments));
        syncToServer('appointments', 'delete', null, id);

        logAudit({
            actorName: appointmentToDelete.patientName || 'Patient',
            action: 'CANCELLED APPOINTMENT',
            targetName: `Session with ${appointmentToDelete.professionalName}`,
            details: `Cancelled appointment on ${appointmentToDelete.date}`,
            notes: `Appointment ID: ${id}`
        });

        // Notify Professional of Cancellation
        addNotification({
            recipientId: appointmentToDelete.professionalId,
            professionalName: appointmentToDelete.professionalName,
            type: 'APPOINTMENT_CANCELLED',
            title: 'Appointment Cancelled',
            message: `${appointmentToDelete.patientName} has cancelled their appointment for ${appointmentToDelete.date} at ${appointmentToDelete.time}.`,
            details: {
                patientName: appointmentToDelete.patientName,
                date: appointmentToDelete.date,
                time: appointmentToDelete.time
            }
        });

        dispatchSync();
        return true;
    }
    return false;
};



export const savePatientProfile = (userId, profileData) => {
    if (typeof window === 'undefined') return;
    let profiles = JSON.parse(localStorage.getItem(KEYS.PATIENT_PROFILES) || '[]');

    // Migration: If legacy object format, convert to array
    if (!Array.isArray(profiles)) {
        profiles = Object.values(profiles);
    }

    const index = profiles.findIndex(p => p.userId === userId);

    const newProfile = {
        userId,
        ...profileData,
        lastUpdated: new Date().toISOString()
    };

    if (index !== -1) {
        profiles[index] = { ...profiles[index], ...newProfile };
    } else {
        profiles.push(newProfile);
    }

    localStorage.setItem(KEYS.PATIENT_PROFILES, JSON.stringify(profiles));
    syncToServer('patient_profiles', 'save', newProfile, userId);
    localStorage.setItem(KEYS.PATIENT_PROFILES, JSON.stringify(profiles));
    syncToServer('patient_profiles', 'save', newProfile, userId);

    logAudit({
        actorName: 'System/User',
        action: 'UPDATED PROFILE',
        targetName: `Patient Profile ${userId}`,
        details: 'Updated personal or medical details',
        notes: `Profile Update for ${userId}`
    });

    dispatchSync();
};

// Custom Event for cross-component sync
export const SYNC_EVENT = 'dr_kal_sync';

export const dispatchSync = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(SYNC_EVENT));
    }
};

export const saveGlobalRecord = async (record) => {
    if (typeof window === 'undefined') return;
    const records = JSON.parse(localStorage.getItem(KEYS.RECORDS) || '[]');
    const newRecord = {
        id: `REC-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...record
    };
    records.unshift(newRecord);
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));

    // Persist to Server Database
    try {
        const res = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                patientId: newRecord.pathNumber, // Mapping pathNumber to patientId
                fileName: newRecord.fileName,
                unit: newRecord.unit,
                professionalRole: newRecord.professionalRole || 'SCIENTIST', // Default if missing
                structuredResults: newRecord.structuredResults
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to sync record to DB');
        }
    } catch (err) {
        console.error("Failed to sync record to DB", err);
        throw err; // Re-throw so caller can handle it
    }

    // External Sync & Activity Log
    syncToExternalSystems('RECORD_UPDATED', {
        recordId: newRecord.id,
        patientId: newRecord.pathNumber,
        professionalRole: newRecord.professionalRole,
        fileName: newRecord.fileName
    });

    logAudit({
        actorName: newRecord.scientist || newRecord.professionalRole || 'Staff',
        action: 'DISPATCHED RECORD',
        targetName: newRecord.fileName,
        details: `Dispatched new ${newRecord.unit || 'record'} for Patient ${newRecord.pathNumber}`,
        notes: `Record ID: ${newRecord.id}`
    });

    // Internal Dashboard Alert for Doctors/Nurses
    addNotification({
        recipientId: 'STAFF',
        professionalName: 'Doctor', // Defaulting to Doctor for the demo
        type: 'RECORD_UPDATED',
        title: 'New Clinical Record',
        message: `${newRecord.scientist || 'Staff'} dispatched record "${newRecord.fileName}" for Patient ${newRecord.pathNumber}.`,
        details: {
            patientId: newRecord.pathNumber,
            fileName: newRecord.fileName
        }
    });

    dispatchSync();
    return newRecord;
};



export const updatePatientVitals = (pathNumber, vitals) => {
    if (typeof window === 'undefined') return;
    const allVitals = JSON.parse(localStorage.getItem(KEYS.VITALS) || '{}');
    allVitals[pathNumber] = {
        ...allVitals[pathNumber],
        ...vitals,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(KEYS.VITALS, JSON.stringify(allVitals));
    dispatchSync();
};

export const sendGlobalMessage = (msg) => {
    if (typeof window === 'undefined') return;
    const messages = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
    const newMsg = {
        id: `MSG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...msg
    };
    messages.push(newMsg);
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
    dispatchSync();
    return newMsg;
};

export const deleteGlobalMessage = (id) => {
    if (typeof window === 'undefined') return;
    const messages = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]');
    const newMessages = messages.filter(msg => msg.id !== id);

    if (messages.length !== newMessages.length) {
        localStorage.setItem(KEYS.MESSAGES, JSON.stringify(newMessages));
        dispatchSync();
        return true;
    }
    return false;
};

export const getGlobalData = (key, defaultValue = []) => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error(`Failed to parse global data for key ${key}`, e);
        return defaultValue;
    }
};

export const saveAppointment = (appointment) => {
    if (typeof window === 'undefined') return;
    const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    const newAppointment = {
        id: `APP-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'Upcoming',
        ...appointment
    };
    appointments.unshift(newAppointment);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
    syncToServer('appointments', 'add', newAppointment);

    // External Sync & Activity Log
    syncToExternalSystems('APPOINTMENT_BOOKED', {
        appointmentId: newAppointment.id,
        patientName: newAppointment.patientName,
        professionalName: newAppointment.professionalName,
        date: newAppointment.date,
        time: newAppointment.time
    });

    logAudit({
        actorName: newAppointment.patientName || 'Patient',
        action: 'BOOKED APPOINTMENT',
        targetName: `Session with ${newAppointment.professionalName}`,
        details: `Booked for ${newAppointment.date} at ${newAppointment.time}`,
        notes: `Appointment ID: ${newAppointment.id}`
    });
};

export const updateAppointmentStatus = (id, updates) => {
    if (typeof window === 'undefined') return;
    const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    const appIndex = appointments.findIndex(a => a.id === id);

    if (appIndex !== -1) {
        // Merge updates
        appointments[appIndex] = { ...appointments[appIndex], ...updates };

        // Save
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
        dispatchSync();

        // Check for "Complete" Transition Logic
        // Triggers: ServiceRendered OR Payment
        checkAppointmentCompletion(id);
    }
};

export const checkAppointmentCompletion = (id) => {
    if (typeof window === 'undefined') return;
    const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    const app = appointments.find(a => a.id === id);

    if (app && app.status !== 'Complete' && app.status !== 'Cancelled') {
        const isPaid = (parseFloat(app.amountPaid || 0) >= parseFloat(app.balanceDue || 0));
        // 'servicesRendered' is a flag set when a consultation/lab result is submitted
        const isServiceDone = app.servicesRendered === true;

        if (isPaid && isServiceDone) {
            app.status = 'Complete';
            // Save updated status
            localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
            dispatchSync();

            // Notify
            addNotification({
                recipientId: app.patientId,
                professionalName: app.professionalName,
                type: 'APPOINTMENT_COMPLETE',
                title: 'Session Completed',
                message: `Your appointment with ${app.professionalName} is now marked as Complete. Thank you!`,
                details: { appointmentId: id }
            });
        }
    }

    // Internal Dashboard Alert for the Professional
    // Fix: Send to 'scientist' role (like Pharmacist) if category is Scientist
    const recipientId = newAppointment.professionalCategory === 'Scientist' ? 'scientist' : newAppointment.professionalId;

    addNotification({
        recipientId: recipientId,
        professionalName: newAppointment.professionalName,
        type: 'APPOINTMENT_BOOKING',
        title: 'New Appointment Booking',
        message: `${newAppointment.patientName} booked a ${newAppointment.type} session for ${newAppointment.date} at ${newAppointment.time}.`,
        details: {
            patientName: newAppointment.patientName,
            patientId: newAppointment.patientId,
            appointmentType: newAppointment.type,
            date: newAppointment.date,
            time: newAppointment.time,
            amountPaid: newAppointment.amountPaid,
            balanceDue: newAppointment.balanceDue
        }
    });

    // Internal Dashboard Alert for the Patient (Payment Confirmation)
    addNotification({
        recipientId: newAppointment.patientId,
        professionalName: newAppointment.patientName,
        type: 'APPOINTMENT_CONFIRMED',
        title: 'Appointment Confirmed & Payment Received',
        message: `Your appointment with ${newAppointment.professionalName} for ${newAppointment.date} at ${newAppointment.time} has been successfully booked and payment processed.`,
        details: {
            appointmentId: newAppointment.id,
            patientId: newAppointment.patientId,
            professionalName: newAppointment.professionalName,
            date: newAppointment.date,
            time: newAppointment.time,
            paymentStatus: 'Paid'
        }
    });

    // Payment Confirmation Alert for the Professional (Only if paid)
    if (newAppointment.amountPaid > 0) {
        addNotification({
            recipientId: newAppointment.professionalId,
            professionalName: newAppointment.professionalName,
            type: 'PAYMENT_CONFIRMATION',
            title: 'Payment Confirmed',
            message: `Payment of GHS ${newAppointment.amountPaid} confirmed for ${newAppointment.patientName}'s appointment on ${newAppointment.date}.`,
            details: {
                patientName: newAppointment.patientName,
                amount: `GHS ${newAppointment.amountPaid}`
            }
        });
    }

    dispatchSync();
    return newAppointment;
};

export const updateAppointment = (id, updates) => {
    if (typeof window === 'undefined') return;
    const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
        const oldApp = appointments[index];
        appointments[index] = { ...appointments[index], ...updates };
        localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
        syncToServer('appointments', 'update', null, id, updates);

        // External Sync & Activity Log if status or payment changed
        if (updates.status || updates.paymentStatus) {
            const eventType = updates.paymentStatus === 'Paid' ? 'PAYMENT_RECEIVED' : 'APPOINTMENT_UPDATED';

            syncToExternalSystems(eventType, {
                appointmentId: id,
                patientName: appointments[index].patientName,
                status: updates.status || appointments[index].status,
                paymentStatus: updates.paymentStatus || appointments[index].paymentStatus
            });

            logAudit({
                actorName: updates.updatedBy || 'Staff',
                action: eventType === 'PAYMENT_RECEIVED' ? 'RECEIVED PAYMENT' : 'UPDATED BOOKING',
                targetName: `Appointment ${id}`,
                details: eventType === 'PAYMENT_RECEIVED' ? `Payment confirmed` : `Status updated to ${updates.status}`,
                notes: `ID: ${id}`
            });

            // Alert for the Patient
            addNotification({
                recipientId: appointments[index].patientId,
                professionalName: appointments[index].patientName, // Patients also use AlertsView in some contexts or we can use this for the feed
                type: 'APPOINTMENT_CONFIRMED',
                title: 'Healthcare Update',
                message: `Your appointment status has been updated to: ${updates.status || appointments[index].status}.`,
                details: { appointmentId: id }
            });
        }

        dispatchSync();
    }
};

export const addNotification = (notification) => {
    if (typeof window === 'undefined') return;
    const notifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
    const newNotif = {
        id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        status: 'Unread', // Unread, Read, Dismissed, Snoozed
        ...notification
    };
    notifications.unshift(newNotif);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));

    syncToServer('notifications', 'add', newNotif);

    dispatchSync();
    return newNotif;
};

export const updateNotificationStatus = (id, updates) => {
    if (typeof window === 'undefined') return;
    const notifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index] = { ...notifications[index], ...updates };
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));

        syncToServer('notifications', 'update', null, id, updates);

        dispatchSync();
    }
};

export const getBookingCount = (professionalName, date) => {
    if (typeof window === 'undefined') return 0;
    const appointments = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    // Filter by professional name and date (strip time if stored as full ISO)
    return appointments.filter(a =>
        a.professionalName === professionalName &&
        a.date === date &&
        a.status !== 'Cancelled'
    ).length;
};

export const logActivity = (activity) => {
    if (typeof window === 'undefined') return;
    const activities = JSON.parse(localStorage.getItem(KEYS.ACTIVITY) || '[]');
    const newActivity = {
        id: `ACT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...activity
    };
    activities.unshift(newActivity);
    // Limit to last 200 activities to avoid localStorage bloat
    // Limit to last 200 activities to avoid localStorage bloat
    localStorage.setItem(KEYS.ACTIVITY, JSON.stringify(activities.slice(0, 200)));

    syncToServer('activity_logs', 'add', newActivity);

    dispatchSync();
    return newActivity;
};

export const logAudit = ({ actorId, actorName, action, targetId, targetName, location = 'System', notes = '' }) => {
    if (typeof window === 'undefined') return;
    const auditLogs = JSON.parse(localStorage.getItem(KEYS.AUDIT) || '[]');

    // Format: DOCTOR_123 viewed PATIENT_456 record at 10:42 UTC
    // We store structured data but also a human-readable message similar to the requirement
    const timestamp = new Date().toISOString();
    const newLog = {
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        actorId,
        actorName,
        action,
        targetId,
        targetName,
        location, // e.g., IP address or "NurseDashboard"
        notes,
        formattedLog: `${actorName} (${actorId}) ${action} ${targetName} (${targetId}) at ${timestamp}`
    };

    auditLogs.unshift(newLog);
    // Keep a reasonable history, maybe more than activity logs for legal reasons
    localStorage.setItem(KEYS.AUDIT, JSON.stringify(auditLogs.slice(0, 1000)));

    syncToServer('audit_logs', 'add', newLog);
    dispatchSync();
    return newLog;
};

export const updateConfig = (updates) => {
    if (typeof window === 'undefined') return;
    const config = JSON.parse(localStorage.getItem(KEYS.CONFIG) || '{}');
    const newConfig = { ...config, ...updates };
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(newConfig));
    dispatchSync();
    return newConfig;
};

export const savePrescription = (rx) => {
    if (typeof window === 'undefined') return;
    const prescriptions = JSON.parse(localStorage.getItem(KEYS.PRESCRIPTIONS) || '[]');
    const newRx = {
        id: `RX-${Date.now()}`,
        status: 'Active',
        dateIssued: new Date().toISOString().split('T')[0],
        ...rx
    };
    prescriptions.unshift(newRx);
    localStorage.setItem(KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));

    syncToServer('prescriptions', 'add', newRx);

    logAudit({
        actorName: rx.doctorName || 'Doctor',
        action: 'ISSUED PRESCRIPTION',
        targetName: rx.drug,
        details: `Prescribed ${rx.dosage} for ${rx.patientName}`,
        notes: `RX ID: ${newRx.id}`
    });

    addNotification({
        recipientId: 'PHARMACIST',
        professionalName: 'Pharmacist',
        type: 'PRESCRIPTION_ISSUED',
        title: 'New Prescription Entry',
        message: `New manual entry for ${rx.patientName}: ${rx.drug}`,
        details: { rxId: newRx.id }
    });

    dispatchSync();
    return newRx;
};

export const getConfig = (key, defaultValue) => {
    if (typeof window === 'undefined') return defaultValue;
    const config = JSON.parse(localStorage.getItem(KEYS.CONFIG) || '{}');
    return key ? (config[key] ?? defaultValue) : config;
};


