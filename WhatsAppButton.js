"use client";

export default function WhatsAppButton({ phoneNumber, label = "Chat on WhatsApp", message = "Hello, I would like to book a consultation." }) {
    // Format phone number: remove non-digits, ensure country code if needed (defaulting to placeholder if generic)
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
                backgroundColor: '#25D366',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
            }}
        >
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style={{ width: '20px', height: '20px' }} />
            {label}
        </a>
    );
}
