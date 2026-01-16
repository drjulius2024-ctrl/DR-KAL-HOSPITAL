export const TOP_COUNTRIES = ["Ghana", "United States", "United Kingdom", "Canada"];

export const AFRICAN_COUNTRIES = [
    "Nigeria", "South Africa", "Kenya", "Egypt", "Ethiopia", "Tanzania", "Uganda", "Algeria", "Sudan", "Morocco",
    "Angola", "Mozambique", "Ghana", "Madagascar", "Cameroon", "Côte d'Ivoire", "Niger", "Burkina Faso", "Mali",
    "Malawi", "Zambia", "Senegal", "Chad", "Somalia", "Zimbabwe", "Guinea", "Rwanda", "Benin", "Burundi", "Tunisia",
    "South Sudan", "Togo", "Sierra Leone", "Libya", "Congo", "Liberia", "Central African Republic", "Mauritania",
    "Eritrea", "Namibia", "Gambia", "Botswana", "Gabon", "Lesotho", "Guinea-Bissau", "Equatorial Guinea", "Mauritius",
    "Eswatini", "Djibouti", "Comoros", "Cabo Verde", "Sao Tome and Principe", "Seychelles"
];

// Sort and unique
export const ALL_COUNTRIES = Array.from(new Set([...TOP_COUNTRIES, ...AFRICAN_COUNTRIES.sort()]));

export const COUNTRY_CODES = {
    "Ghana": "+233",
    "United States": "+1",
    "United Kingdom": "+44",
    "Canada": "+1",
    "Nigeria": "+234",
    "South Africa": "+27",
    "Kenya": "+254",
    // Add defaults or common ones, fallback to user input if needed
    "default": "+"
};

export const POPULAR_REGIONS = {
    "Ghana": [
        "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East",
        "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"
    ],
    "United States": [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
        "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
        "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
        "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
        "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
    ],
    "United Kingdom": [
        "England", "Scotland", "Wales", "Northern Ireland"
    ],
    "Canada": [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"
    ],
    "Nigeria": ["Lagos", "Abuja", "Kano", "Rivers", "Oyo", "Delta", "Kaduna"], // Sample
    "South Africa": ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"], // Sample
    "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru"] // Sample
};

export const getRegions = (country) => {
    return POPULAR_REGIONS[country] || []; // Return empty if no specific regions known (will trigger text input)
};

export const getCountryCode = (country) => {
    return COUNTRY_CODES[country] || "+";
};
