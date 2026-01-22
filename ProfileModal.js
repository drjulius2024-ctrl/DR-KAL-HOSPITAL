import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';

// Let's assume we need to build a self-contained modal helper or reusing one.
// ProfessionalDashboard uses Card, Button, Input. Let's use those.

export default function ProfileModal({ user, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
        whatsappNumber: user.whatsappNumber || '',
        bio: user.bio || '',
        licenseNumber: user.licenseNumber || '',
        yearsOfExperience: user.yearsOfExperience || '',
        currentFacility: user.currentFacility || '',
        country: user.country || '',
        country: user.country || '',
        region: user.region || '',
        specialization: user.specialization || '',
        avatarUrl: user.avatarUrl || '' // Base64 string
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Compress image
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimensions
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Reduce quality to 0.7
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData(prev => ({ ...prev, avatarUrl: dataUrl }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                onSave(updatedUser);
                onClose();
            } else {
                const errorData = await res.json();
                alert('Failed to update profile: ' + (errorData.error || 'Unknown Server Error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error updating profile: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', width: '600px', maxWidth: '95%',
                maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Profile</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>

                    {/* Avatar Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{
                            width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden',
                            border: '3px solid #eee', position: 'relative', background: '#f8f9fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '2rem' }}>👨‍⚕️</span>
                            )}
                        </div>
                        <label style={{
                            marginTop: '0.5rem', color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
                        }}>
                            <Camera size={16} /> Change Photo
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>


                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Full Name</label>
                            <input className="input-field" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Specialization / Expertise</label>
                            <input
                                className="input-field"
                                name="specialization"
                                value={formData.specialization || ''}
                                onChange={handleChange}
                                placeholder="e.g. Cardiologist, Pediatrician"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Current Facility</label>
                        <input className="input-field" name="currentFacility" value={formData.currentFacility} onChange={handleChange} style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Bio / About Me</label>
                        <textarea
                            className="input-field"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Tell patients about your specialty..."
                            style={{ width: '100%', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Phone Number</label>
                            <input className="input-field" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>WhatsApp Number</label>
                            <input className="input-field" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>License Number</label>
                            <input className="input-field" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Years of Experience</label>
                            <input className="input-field" type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Country</label>
                            <input className="input-field" name="country" value={formData.country} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.3rem' }}>Region</label>
                            <input className="input-field" name="region" value={formData.region} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={isSaving} style={{ padding: '0.5rem 1.5rem', borderRadius: '6px', border: 'none', background: '#0ea5e9', color: 'white', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
