import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID required' }, { status: 400 });
        }

        // Fetch vitals history (Recent 20)
        const vitals = await prisma.medicalRecord.findMany({
            where: {
                patientId: patientId,
                unit: 'VITALS'
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Parse structured data for easier frontend consumption
        const parsedVitals = vitals.map(v => {
            const data = typeof v.structuredData === 'string' ? JSON.parse(v.structuredData || '{}') : (v.structuredData || {});
            return {
                id: v.id,
                date: v.date,
                time: v.time,
                recordedBy: v.professionalName,
                ...data.results // Spread the actual vital values (bp, hr, etc.)
            };
        });

        return NextResponse.json(parsedVitals);

    } catch (error) {
        console.error("Failed to fetch vitals", error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role === 'patient') {
            return NextResponse.json({ error: 'Patients cannot record own clinical vitals' }, { status: 403 });
        }

        const data = await request.json();
        const { patientId, patientName, results } = data;

        if (!patientId || !results) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create Medical Record for Vitals
        const newRecord = await prisma.medicalRecord.create({
            data: {
                patientId,
                patientName: patientName || 'Unknown',
                professionalId: session.user.id,
                professionalName: session.user.name,
                professionalRole: session.user.role.toUpperCase(),
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString(),
                fileName: 'Vitals Log',
                fileType: 'application/json',
                unit: 'Vitals',
                structuredData: JSON.stringify({
                    testName: 'Vital Signs',
                    results: results // { hr, bp, spo2, temp, weight, glucose }
                })
            }
        });

        return NextResponse.json(newRecord);

    } catch (error) {
        console.error("Failed to post vitals", error);
        return NextResponse.json({ error: 'Failed to save vitals' }, { status: 500 });
    }
}
