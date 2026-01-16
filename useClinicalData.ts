import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Patient {
    id: string;
    name: string;
    // Add other properties as needed based on API response
    [key: string]: any;
}

interface Vital {
    id: string;
    patientId: string;
    bp?: string;
    hr?: number;
    spo2?: number;
    temp?: number;
    rr?: number;
    bloodPressure?: string; // Legacy/Alt
    heartRate?: number; // Legacy/Alt
    temperature?: number; // Legacy/Alt
    recordedAt: string;
    [key: string]: any;
}

interface Task {
    id: string;
    description: string;
    status: string;
    priority: string;
    [key: string]: any;
}

import { assessPatientRisk } from '@/lib/ai_logic';

export function usePatients(query = '') {
    const { data, error, isLoading, mutate } = useSWR<Patient[]>(
        `/api/patients${query ? `?query=${query}` : ''}`,
        fetcher,
        { refreshInterval: 5000 } // Auto-refresh every 5s for near-real-time feel
    );

    // Smart Enriched Data: Calculate Triage Score for each patient
    const enrichedPatients = Array.isArray(data) ? data.map((patient: any) => {
        // Map API's latestVital to flattened 'vitals' object consistent with interface
        const vitals = patient.latestVital || patient.vitals || {};
        const triage = assessPatientRisk(vitals);

        return {
            ...patient,
            vitals, // Ensure 'vitals' property exists for components
            triage
        };
    }) : [];

    return {
        patients: enrichedPatients,
        isLoading,
        isError: error,
        mutate
    };
}

export function useVitals(patientId?: string) {
    const { data, error, isLoading, mutate } = useSWR<Vital[]>(
        patientId ? `/api/vitals?patientId=${patientId}` : null,
        fetcher,
        { refreshInterval: 3000 }
    );

    return {
        vitals: Array.isArray(data) ? data : [],
        latestVital: data && data.length > 0 ? data[0] : null,
        isLoading,
        isError: error,
        mutate
    };
}

export function useTasks(patientId?: string) {
    const { data, error, isLoading, mutate } = useSWR<Task[]>(
        `/api/tasks${patientId ? `?patientId=${patientId}` : ''}`,
        fetcher
    );

    return {
        tasks: Array.isArray(data) ? data : [],
        isLoading,
        isError: error,
        mutate
    };
}
