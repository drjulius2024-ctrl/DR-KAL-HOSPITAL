const getReferenceRange = (param, age, sex) => {
    // Basic WHO Standards (Simplified for Demo)
    // Age in years
    const isAdult = age >= 18;
    const isChild = age < 18;
    const isMale = sex === 'Male';
    const isFemale = sex === 'Female';

    switch (param) {
        // --- HAEMATOLOGY ---
        case 'wbc':
            if (age < 2) return '6.0 - 17.0';
            if (isChild) return '5.0 - 13.0';
            return '4.0 - 10.0';
        case 'rbc':
            if (isMale && isAdult) return '4.5 - 5.9';
            if (isFemale && isAdult) return '4.0 - 5.2';
            return '3.8 - 5.5';
        case 'hgb':
            if (age < 6) return '11.0 - 14.0';
            if (age < 12) return '11.5 - 15.5';
            if (isMale && isAdult) return '13.0 - 17.0';
            if (isFemale && isAdult) return '12.0 - 15.0';
            return '11.0 - 16.0';
        case 'plt':
            return '150 - 410';
        case 'esr':
            if (isMale) return age > 50 ? '0 - 20' : '0 - 15';
            if (isFemale) return age > 50 ? '0 - 30' : '0 - 20';
            return '0 - 10';

        // --- CHEMICAL PATHOLOGY ---
        case 'creatinine': // BUE
            if (age < 3) return '18 - 35';
            if (age < 12) return '27 - 62';
            if (isMale) return '62 - 110';
            if (isFemale) return '52 - 93';
            return '60 - 110'; // Fallback
        case 'urea':
            if (age < 1) return '1.4 - 4.3';
            if (age < 18) return '1.8 - 6.4';
            return '2.5 - 7.1';
        case 'rbs':
        case 'fbs':
            // General Diabetes thresholds
            return param === 'rbs' ? '< 7.8' : '3.9 - 5.6';
        case 'psa':
            if (age < 50) return '< 2.5';
            if (age < 60) return '< 3.5';
            if (age < 70) return '< 4.5';
            return '< 6.5';
        case 'tsh':
            if (age < 1) return '0.52 - 6.0'; // Approx infant
            if (age < 18) return '0.42 - 5.0'; // Adolescent
            return '0.4 - 4.0'; // Adult
        case 'testos':
            if (isMale) return isAdult ? '270 - 1070' : '10 - 200'; // ng/dL approx
            if (isFemale) return '15 - 70';
            return '';
        case 'prolac':
            if (isMale) return '4 - 15.2';
            if (isFemale) return '4.8 - 23.3';
            return '';
        case 'ggt':
            if (isMale) return '10 - 71';
            return '6 - 42';
        case 'ast':
            if (age < 18) return '0 - 60';
            return '0 - 40';
        case 'alt':
            if (isMale) return '0 - 41';
            return '0 - 33';
        case 'alp':
            if (age < 18) return '60 - 300'; // High in growth
            return '40 - 129';

        // --- ELECTROLYTES ---
        case 'sodium': return '135 - 145';
        case 'potassium': return '3.5 - 5.1';
        case 'chloride': return '98 - 107';
        case 'bicarbonate': return '22 - 29';

        // --- PROTEINS ---
        case 'total_protein': return '60 - 80';
        case 'albumin': return '35 - 50';

        // --- BILIRUBIN ---
        case 'bilirubin_total': return '3 - 21';
        case 'bilirubin_direct': return '< 5';

        // --- OTHER RFT ---
        case 'uric_acid':
            if (isMale) return '200 - 430';
            if (isFemale) return '140 - 360';
            return '150 - 400';

        default:
            return '';
    }
};

export const LAB_TESTS = {
    haematology: [
        {
            id: 'fbc', name: 'FBC (Full Blood Count)', parameters: [
                { id: 'wbc', label: 'WBC', unit: 'x10^9/L', default: '5.0', getRange: (a, s) => getReferenceRange('wbc', a, s) },
                { id: 'rbc', label: 'RBC', unit: 'x10^12/L', default: '4.5', getRange: (a, s) => getReferenceRange('rbc', a, s) },
                { id: 'hgb', label: 'Hemoglobin', unit: 'g/dL', default: '14.0', getRange: (a, s) => getReferenceRange('hgb', a, s) },
                { id: 'plt', label: 'Platelets', unit: 'x10^9/L', default: '250', getRange: (a, s) => getReferenceRange('plt', a, s) },
                { id: 'mcv', label: 'MCV', unit: 'fL', default: '85', range: '80 - 96' },
                { id: 'mch', label: 'MCH', unit: 'pg', default: '29', range: '27 - 33' },
                { id: 'mchc', label: 'MCHC', unit: 'g/dL', default: '34', range: '33 - 36' }
            ]
        },
        {
            id: 'malaria', name: 'MALARIA TEST', parameters: [
                { id: 'mp', label: 'MP Result', unit: '', default: 'Negative' },
                { id: 'density', label: 'Parasite Density', unit: '/uL', default: '' }
            ]
        },
        {
            id: 'coagulation', name: 'COAGULATION TEST', parameters: [
                { id: 'pt', label: 'PT', unit: 'sec', default: '12', range: '11 - 13.5' },
                { id: 'aptt', label: 'APTT', unit: 'sec', default: '30', range: '30 - 40' },
                { id: 'inr', label: 'INR', unit: '', default: '1.0', range: '0.8 - 1.2' }
            ]
        },
        {
            id: 'ddimer', name: 'D-DIMER', parameters: [
                { id: 'val', label: 'Result', unit: 'ng/mL', default: '', range: '< 500' }
            ]
        },
        {
            id: 'blood_film', name: 'BLOOD FILM COMMENT', parameters: [
                { id: 'comment', label: 'Comment', type: 'textarea', default: '' }
            ]
        },
        {
            id: 'sickle', name: 'SICKLE CELL', parameters: [
                { id: 'genotype', label: 'Genotype', unit: '', default: 'AA' }
            ]
        },
        {
            id: 'esr', name: 'ESR', parameters: [
                { id: 'val', label: 'ESR Rate', unit: 'mm/hr', default: '', getRange: (a, s) => getReferenceRange('esr', a, s) }
            ]
        }
    ],
    microbiology: [
        { id: 'blood_cs_child', name: 'Blood CS (Child)', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'blood_cs_adult', name: 'Blood CS (Adult)', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'semen', name: 'Semen Analysis', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'pcr', name: 'PCR', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'genexpert', name: 'Gene Xpert', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'urine_cs', name: 'Urine CS', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'stool_cs', name: 'Stool CS', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'sputum_cs', name: 'SPUTUM CS', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'pleural_flu', name: 'PLEURAL FLUID CS', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'hvs', name: 'High Vagina Swab', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'skin', name: 'Skin Scrapping', parameters: [{ id: 'res', label: 'Result', default: '' }] }
    ],
    pathology: [
        { id: 'tissue', name: 'Tissue Biopsy', parameters: [{ id: 'res', label: 'Findings', default: '' }] },
        { id: 'autopsy', name: 'Autopsy', parameters: [{ id: 'res', label: 'Findings', default: '' }] },
        { id: 'papsmear', name: 'PAP SMEAR', parameters: [{ id: 'res', label: 'Findings', default: '' }] },
        { id: 'cervical', name: 'CERVICAL SMEAR', parameters: [{ id: 'res', label: 'Findings', default: '' }] }
    ],
    immunology: [
        { id: 'bg', name: 'Blood Grouping Test', parameters: [{ id: 'res', label: 'Group', default: '' }] },
        { id: 'hbsag', name: 'HBsAg', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'hcv', name: 'HCV', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'hav', name: 'HAV', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'oral', name: 'ORAL QUICK', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'hepb_prof', name: 'HEP B PROFILE', parameters: [{ id: 'res', label: 'Result', default: '' }] },
        { id: 'eliza', name: 'ELISA', parameters: [{ id: 'res', label: 'Result', default: '' }] }
    ],
    chemical_path: [
        { id: 'bue', name: 'BUE CREATININE', parameters: [{ id: 'val', label: 'Value', unit: 'µmol/L', default: '', getRange: (a, s) => getReferenceRange('creatinine', a, s) }] },
        {
            id: 'lft', name: 'LFT (Liver Function Test)', parameters: [
                { id: 'bilirubin_total', label: 'Total Bilirubin', unit: 'µmol/L', default: '', getRange: (a, s) => getReferenceRange('bilirubin_total', a, s) },
                { id: 'bilirubin_direct', label: 'Direct Bilirubin', unit: 'µmol/L', default: '', getRange: (a, s) => getReferenceRange('bilirubin_direct', a, s) },
                { id: 'ast', label: 'AST (SGOT)', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('ast', a, s) },
                { id: 'alt', label: 'ALT (SGPT)', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('alt', a, s) },
                { id: 'alp', label: 'ALP', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('alp', a, s) },
                { id: 'ggt', label: 'GGT', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('ggt', a, s) },
                { id: 'total_protein', label: 'Total Protein', unit: 'g/L', default: '', getRange: (a, s) => getReferenceRange('total_protein', a, s) },
                { id: 'albumin', label: 'Albumin', unit: 'g/L', default: '', getRange: (a, s) => getReferenceRange('albumin', a, s) }
            ]
        },
        {
            id: 'rft', name: 'RFT (Renal Function Test)', parameters: [
                { id: 'urea', label: 'Urea', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('urea', a, s) },
                { id: 'creatinine', label: 'Creatinine', unit: 'µmol/L', default: '', getRange: (a, s) => getReferenceRange('creatinine', a, s) },
                { id: 'uric_acid', label: 'Uric Acid', unit: 'µmol/L', default: '', getRange: (a, s) => getReferenceRange('uric_acid', a, s) }
            ]
        },
        { id: 'rbs', name: 'RBS (Random Blood Sugar)', parameters: [{ id: 'val', label: 'Value', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('rbs', a, s) }] },
        { id: 'fbs', name: 'FBS (Fasting Blood Sugar)', parameters: [{ id: 'val', label: 'Value', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('fbs', a, s) }] },
        { id: 'crp', name: 'CRP', parameters: [{ id: 'val', label: 'Value', unit: 'mg/L', default: '', range: '< 5' }] },
        { id: 'psa', name: 'PSA', parameters: [{ id: 'val', label: 'Value', unit: 'ng/mL', default: '', getRange: (a, s) => getReferenceRange('psa', a, s) }] },
        { id: 'lh', name: 'LH', parameters: [{ id: 'val', label: 'Value', unit: 'IU/L', default: '' }] },
        { id: 'fsh', name: 'FSH', parameters: [{ id: 'val', label: 'Value', unit: 'IU/L', default: '' }] },
        { id: 'tsh', name: 'TSH', parameters: [{ id: 'val', label: 'Value', unit: 'mIU/L', default: '', getRange: (a, s) => getReferenceRange('tsh', a, s) }] },
        { id: 't3', name: 'T3', parameters: [{ id: 'val', label: 'Value', unit: 'nmol/L', default: '', range: '1.2 - 3.1' }] },
        { id: 't4', name: 'T4', parameters: [{ id: 'val', label: 'Value', unit: 'nmol/L', default: '', range: '66 - 181' }] },
        { id: 'estro', name: 'OESTROGEN', parameters: [{ id: 'val', label: 'Value', unit: 'pg/mL', default: '' }] },
        { id: 'proger', name: 'PROGESTERONE', parameters: [{ id: 'val', label: 'Value', unit: 'ng/mL', default: '' }] },
        { id: 'testos', name: 'TESTOSTERONE', parameters: [{ id: 'val', label: 'Value', unit: 'ng/dL', default: '', getRange: (a, s) => getReferenceRange('testos', a, s) }] },
        { id: 'prolac', name: 'PROLACTIN', parameters: [{ id: 'val', label: 'Value', unit: 'ng/mL', default: '', getRange: (a, s) => getReferenceRange('prolac', a, s) }] },
        { id: 'ggt', name: 'GGT', parameters: [{ id: 'val', label: 'Value', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('ggt', a, s) }] },
        {
            id: 'electro', name: 'ELECTROLYTES', parameters: [
                { id: 'sodium', label: 'Sodium (Na+)', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('sodium', a, s) },
                { id: 'potassium', label: 'Potassium (K+)', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('potassium', a, s) },
                { id: 'chloride', label: 'Chloride (Cl-)', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('chloride', a, s) },
                { id: 'bicarbonate', label: 'Bicarbonate (HCO3)', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('bicarbonate', a, s) }
            ]
        },
        {
            id: 'bilirubin', name: 'BILIRUBIN', parameters: [
                { id: 'direct', label: 'Direct', unit: 'µmol/L', default: '', range: '< 5' },
                { id: 'indirect', label: 'Indirect', unit: 'µmol/L', default: '' }
            ]
        },
        { id: 'ast', name: 'AST', parameters: [{ id: 'val', label: 'Value', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('ast', a, s) }] },
        { id: 'alp', name: 'ALP', parameters: [{ id: 'val', label: 'Value', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('alp', a, s) }] },
        { id: 'alt', name: 'ALT', parameters: [{ id: 'val', label: 'Value', unit: 'U/L', default: '', getRange: (a, s) => getReferenceRange('alt', a, s) }] },
        { id: 'urea', name: 'UREA', parameters: [{ id: 'val', label: 'Value', unit: 'mmol/L', default: '', getRange: (a, s) => getReferenceRange('urea', a, s) }] }
    ],
    sti: [
        { id: 'hiv', name: 'HIV', parameters: [{ id: 'res', label: 'Result', default: 'Negative' }] },
        { id: 'syphils', name: 'SYPHILIS', parameters: [{ id: 'res', label: 'Result', default: 'Negative' }] },
        { id: 'gorno', name: 'GONORRHEA', parameters: [{ id: 'res', label: 'Result', default: 'Negative' }] }
    ]
};
