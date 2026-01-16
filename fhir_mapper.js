/**
 * FHIR Mapper Utility
 * Maps internal data models to HL7 FHIR R4 Standard Resources
 */

/**
 * Maps a Patient User and Profile to FHIR Patient Resource
 * @param {Object} user - The user object (auth)
 * @param {Object} profile - The patient profile object (medical)
 * @returns {Object} FHIR Patient Resource
 */
export const mapToFHIRPatient = (user, profile = {}) => {
    // Split name
    const fullName = profile.fullName || user.name || '';
    const nameParts = fullName.split(' ');
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : fullName;
    const givenNames = nameParts.length > 1 ? nameParts.slice(0, -1) : [fullName];

    return {
        resourceType: "Patient",
        id: user.id || profile.id,
        identifier: [
            {
                use: "official",
                system: "https://drkalhospital.com/details/path-number",
                value: user.id || profile.id // PATH-Number
            }
        ],
        active: true,
        name: [
            {
                use: "official",
                family: familyName,
                given: givenNames
            }
        ],
        telecom: [
            {
                system: "phone",
                value: profile.phone || profile.phoneNumber || user.phoneNumber,
                use: "mobile"
            },
            {
                system: "email",
                value: profile.email || user.email,
                use: "home"
            }
        ],
        gender: (profile.sex || profile.gender || user.gender || 'unknown').toLowerCase(),
        birthDate: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : undefined,
        address: [
            {
                use: "home",
                line: [profile.address || ''],
                city: profile.region || '', // Mapping Region to City/District for simplicity or State
                state: profile.region,
                country: profile.country || user.country || 'Ghana'
            }
        ],
        meta: {
            lastUpdated: new Date().toISOString()
        }
    };
};

/**
 * Maps an Appointment to FHIR Appointment Resource
 * @param {Object} appointment 
 * @returns {Object} FHIR Appointment Resource
 */
export const mapToFHIRAppointment = (appointment) => {
    // Construct start/end dates from date and time strings
    // Appointment date: "2025-12-25", time: "09:00 AM"
    let start, end;
    if (appointment.date && appointment.time) {
        try {
            const dateStr = appointment.date;
            const timeStr = appointment.time;
            // Simple parsing
            // Check if time has AM/PM
            let [t, modifier] = timeStr.trim().split(' ');
            let [h, m] = t.split(':');
            if (modifier === 'PM' && h !== '12') h = parseInt(h) + 12;
            if (modifier === 'AM' && h === '12') h = '00';

            start = new Date(`${dateStr}T${h}:${m}:00`).toISOString();
            // Assume 30 min duration
            const endDate = new Date(`${dateStr}T${h}:${m}:00`);
            endDate.setMinutes(endDate.getMinutes() + 30);
            end = endDate.toISOString();
        } catch (e) {
            console.error("Error parsing date", e);
        }
    }

    return {
        resourceType: "Appointment",
        id: appointment.id,
        status: mapStatusToFHIR(appointment.status),
        description: appointment.reason || (appointment.type + " Consultation"),
        start: start,
        end: end,
        created: appointment.createdAt || new Date().toISOString(),
        participant: [
            {
                actor: {
                    reference: `Patient/${appointment.patientId}`,
                    display: appointment.patientName
                },
                required: "required",
                status: "accepted"
            },
            {
                actor: {
                    reference: `Practitioner/${appointment.professionalId || 'UNKNOWN'}`,
                    display: appointment.professionalName
                },
                required: "required",
                status: "accepted"
            }
        ],
        serviceType: [
            {
                coding: [
                    {
                        system: "http://terminology.hl7.org/CodeSystem/service-type",
                        code: appointment.type === 'Video' ? "57" : "1", // 57=Telmed, 1=Gen med (mock)
                        display: appointment.type
                    }
                ]
            }
        ]
    };
};

/**
 * Maps a Clinical Record (Lab Result) to FHIR DiagnosticReport
 * @param {Object} record 
 * @returns {Object} FHIR DiagnosticReport
 */
export const mapToFHIRDiagnosticReport = (record) => {
    return {
        resourceType: "DiagnosticReport",
        id: record.id,
        status: "final",
        category: [
            {
                coding: [
                    {
                        system: "http://terminology.hl7.org/CodeSystem/v2-0074",
                        code: record.unitId || "LAB",
                        display: record.unit
                    }
                ]
            }
        ],
        code: {
            text: record.structuredResults?.testName || record.fileName
        },
        subject: {
            reference: `Patient/${record.pathNumber || 'UNKNOWN'}`,
        },
        effectiveDateTime: record.timestamp || new Date().toISOString(),
        performer: [
            {
                display: record.scientist || record.professionalName || 'Lab Scientist'
            }
        ],
        presentedForm: [
            {
                contentType: record.fileType || "application/pdf",
                url: record.fileUrl || "" // If we have a URL
            }
        ],
        result: record.structuredResults ? Object.entries(record.structuredResults.results || {}).map(([key, val]) => ({
            display: `${key}: ${val}`
        })) : []
    };
};

function mapStatusToFHIR(status) {
    if (!status) return 'booked';
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'upcoming') return 'booked';
    if (s === 'completed') return 'fulfilled';
    if (s === 'cancelled') return 'cancelled';
    if (s === 'no-show') return 'noshow';
    return 'proposed';
}
