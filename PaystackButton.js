"use client";
import { usePaystackPayment } from 'react-paystack';

export default function PaystackButton({ amount, email, firstName, lastName, phone, saveAppointment, appointmentData, onSuccess }) {

    // REPLACE THIS WITH YOUR OWN PUBLIC KEY FROM PAYSTACK DASHBOARD
    const publicKey = 'pk_live_d965ecd5c321f1f1fc869872c2414e6382cfe08c';

    const config = {
        reference: (new Date()).getTime().toString(),
        email: email,
        amount: amount, // Amount is in kobo (GHS * 100)
        publicKey: publicKey,
        currency: 'GHS',
        metadata: {
            custom_fields: [
                { display_name: "First Name", variable_name: "first_name", value: firstName },
                { display_name: "Last Name", variable_name: "last_name", value: lastName },
                { display_name: "Phone Number", variable_name: "phone", value: phone }
            ]
        }
    };

    const initializePayment = usePaystackPayment(config);

    const handleSuccess = (reference) => {
        // Save appointment to DB
        saveAppointment({
            ...appointmentData,
            paymentStatus: 'Paid',
            paymentRef: reference.reference
        });

        alert(`Payment Complete! Reference: ${reference.reference}\n\nYour appointment has been dispatched.`);
        if (onSuccess) onSuccess();
    };

    const handleClose = () => {
        console.log('Payment closed');
    };

    return (
        <div>
            <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', background: '#09a5db', borderColor: '#09a5db', fontWeight: 'bold' }}
                onClick={() => {
                    initializePayment(handleSuccess, handleClose);
                }}
            >
                Pay GHS {(amount / 100).toFixed(2)} with Paystack
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/1f/Paystack.png" alt="Paystack" style={{ height: '15px', opacity: 0.7 }} />
                <span>Secured by Paystack</span>
            </div>
        </div>
    );
}
