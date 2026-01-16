/**
 * Medical Analysis Library
 * Provides automated flagging of clinical results based on Age and Sex.
 */

// Reference Ranges Database
// Note: These are simplified for the demo but generally medically accurate.
export const REFERENCE_RANGES = {
    VITALS: {
        HR: {
            // Heart Rate (bpm)
            Adult: { min: 60, max: 100, unit: 'bpm' },
            Child: { min: 70, max: 120, unit: 'bpm' }, // Child < 12
            Infant: { min: 100, max: 160, unit: 'bpm' } // Infant < 1
        },
        SpO2: {
            // Oxygen Saturation (%)
            All: { min: 95, max: 100, unit: '%' }
        },
        BP_Systolic: {
            // Blood Pressure Systolic (mmHg)
            Adult: { min: 90, max: 120, unit: 'mmHg' },
            Child: { min: 80, max: 110, unit: 'mmHg' }
        },
        BP_Diastolic: {
            // Blood Pressure Diastolic (mmHg)
            Adult: { min: 60, max: 80, unit: 'mmHg' },
            Child: { min: 50, max: 75, unit: 'mmHg' }
        },
        Temp: {
            // Temperature (°C)
            All: { min: 36.1, max: 37.2, unit: '°C' }
        },
        RR: {
            // Respiratory Rate (breaths/min)
            Adult: { min: 12, max: 20, unit: '/min' },
            Child: { min: 18, max: 30, unit: '/min' }
        },
        Glucose: {
            // Blood Glucose (mmol/L) - Random
            All: { min: 4.0, max: 7.8, unit: 'mmol/L' }
        }
    },
    FBC: {
        // Full Blood Count
        Hemoglobin: {
            Male: { min: 13.5, max: 17.5, unit: 'g/dL' },
            Female: { min: 12.0, max: 15.5, unit: 'g/dL' },
            Child: { min: 11.0, max: 16.0, unit: 'g/dL' }
        },
        WBC: {
            // White Blood Cells
            Adult: { min: 4.5, max: 11.0, unit: 'x10^9/L' },
            Child: { min: 5.0, max: 12.0, unit: 'x10^9/L' }
        },
        Platelets: {
            All: { min: 150, max: 450, unit: 'x10^9/L' }
        }
    },
    LFT: {
        // Liver Function Tests
        ALT: { Male: { min: 0, max: 45, unit: 'U/L' }, Female: { min: 0, max: 34, unit: 'U/L' } },
        AST: { Male: { min: 0, max: 40, unit: 'U/L' }, Female: { min: 0, max: 35, unit: 'U/L' } },
        Bilirubin: { All: { min: 0.1, max: 1.2, unit: 'mg/dL' } }
    },
    RFT: {
        // Renal Function Tests
        Creatinine: { Male: { min: 0.7, max: 1.3, unit: 'mg/dL' }, Female: { min: 0.6, max: 1.1, unit: 'mg/dL' } },
        Urea: { All: { min: 7, max: 20, unit: 'mg/dL' } },
        Potassium: { All: { min: 3.5, max: 5.0, unit: 'mmol/L' } },
        Sodium: { All: { min: 135, max: 145, unit: 'mmol/L' } }
    }
};

/**
 * Analyzes a single test result.
 * @param {string} category - 'VITALS', 'FBC', 'LFT', 'RFT'
 * @param {string} testName - e.g., 'HR', 'Hemoglobin'
 * @param {number|string} value - The measured value
 * @param {number} age - Patient age in years
 * @param {string} sex - 'Male' or 'Female'
 * @returns {object} { flag: 'Low'|'Normal'|'High'|'Critical', color: string, range: string, unit: string }
 */
export function analyzeResult(category, testName, value, age = 30, sex = 'Male') {
    // 1. Normalize Inputs
    const cat = REFERENCE_RANGES[category];
    if (!cat) return null; // Category not found

    // Case-insensitive lookup for test name
    const key = Object.keys(cat).find(k => k.toLowerCase() === testName.toLowerCase());
    if (!key) return null; // Test not found

    const testDef = cat[key];
    let range = null;

    // 2. Determine Scope (Age/Sex)
    const isChild = age < 12;
    const isInfant = age < 1;

    if (testDef.Infant && isInfant) range = testDef.Infant;
    else if (testDef.Child && isChild) range = testDef.Child;
    else if (testDef[sex] && !isChild) range = testDef[sex]; // Gender specific (Adult)
    else if (testDef.Adult) range = testDef.Adult; // Generic Adult
    else if (testDef.All) range = testDef.All; // Universal

    // Fallback
    if (!range) range = Object.values(testDef)[0]; // Default to first available

    // 3. Compare Value
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return { flag: 'Normal', color: 'gray', range: `${range.min}-${range.max}`, unit: range.unit };

    let flag = 'Normal';
    let color = 'green';

    if (numVal < range.min) {
        flag = 'Low';
        color = 'orange'; // Warning
        // Simple critical check (e.g. 20% deviation) for demo
        if (numVal < range.min * 0.8) {
            flag = 'Critical Low';
            color = 'red';
        }
    } else if (numVal > range.max) {
        flag = 'High';
        color = 'orange';
        if (numVal > range.max * 1.2) {
            flag = 'Critical High';
            color = 'red';
        }
    }

    return {
        flag,
        color,
        range: `${range.min} - ${range.max}`,
        unit: range.unit
    };
}

/**
 * Helper to analyze basic Blood Pressure string "120/80"
 */
export function analyzeBP(bpString, age = 30) {
    if (!bpString || !bpString.includes('/')) return null;
    const [sys, dia] = bpString.split('/').map(Number);

    const sysAnalysis = analyzeResult('VITALS', 'BP_Systolic', sys, age);
    const diaAnalysis = analyzeResult('VITALS', 'BP_Diastolic', dia, age);

    if (sysAnalysis?.flag.includes('High') || diaAnalysis?.flag.includes('High')) {
        return { flag: 'High BP', color: 'red', valid: true };
    }
    if (sysAnalysis?.flag.includes('Low') || diaAnalysis?.flag.includes('Low')) {
        return { flag: 'Low BP', color: 'orange', valid: true };
    }
    return { flag: 'Normal', color: 'green', valid: true };
}
