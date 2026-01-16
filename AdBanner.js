"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdBanner() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        async function fetchAds() {
            try {
                const res = await fetch('/api/ads');
                const data = await res.json();
                if (data.success) {
                    setAds(data.data);
                }
            } catch (error) {
                console.error("Failed to load ads", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAds();
    }, []);

    // Auto-slide every 10 seconds
    useEffect(() => {
        if (ads.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [ads.length]);

    const nextSlide = (e) => {
        e.preventDefault(); // Prevent link click if wrapped
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
    };

    const prevSlide = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex - 1 + ads.length) % ads.length);
    };

    if (loading || ads.length === 0) return null;

    const ad = ads[currentIndex];

    return (
        <div className="ad-banner-container" style={{ width: '100%', marginBottom: '2rem', position: 'relative' }}>
            {ad.link ? (
                <a href={ad.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                    <AdContent ad={ad} />
                </a>
            ) : (
                <AdContent ad={ad} />
            )}

            {/* Navigation Buttons */}
            {ads.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}
                    >
                        ←
                    </button>
                    <button
                        onClick={nextSlide}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}
                    >
                        →
                    </button>

                    {/* Dots Indicator */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                        {ads.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCurrentIndex(idx);
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function AdContent({ ad }) {
    if (ad.type === 'VIDEO') {
        return (
            <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <video
                    src={ad.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '250px', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    Sponsored
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <img
                src={ad.url}
                alt={ad.title}
                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '600px', objectFit: 'contain', background: '#f8fafc' }}
            />
            {/* WhatsApp CTA Overlay */}
            {
                ad.link && ad.link.includes('wa.me') && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#25D366',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 20
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>💬</span> Chat on WhatsApp
                    </div>
                )
            }

            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                Sponsored
            </div>
        </div >
    );
}
