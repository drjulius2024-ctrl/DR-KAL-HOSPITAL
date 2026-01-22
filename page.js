import Link from 'next/link';
import AdBanner from '@/components/AdBanner'; // Import AdBanner
import NewsFeed from '@/components/NewsFeed'; // Import NewsFeed

export default function Home() {
    return (
        <div className="container">

            {/* Hero Section - Reverted to split layout */}
            <section className="hero-section" style={{ padding: '4rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '5.5rem', marginBottom: '1.5rem', lineHeight: 1.1, fontWeight: '800', color: 'var(--color-navy)' }}>
                        Dr. Kal&apos;s <br />
                        <span style={{ color: 'var(--color-sea-blue)' }}>Virtual Hospital</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '500px' }}>
                        Connect with top-tier medical professionals from the comfort of your home. Secure, efficient, and patient-centered.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href="/register?type=patient" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Get Started as Patient
                        </Link>
                        <Link href="/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Login
                        </Link>
                    </div>
                    <div style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                        <Link href="/register?type=professional" style={{ color: 'var(--color-navy)', fontWeight: 'bold' }}>
                            Are you a Medical Professional? Join us →
                        </Link>
                        <br />
                        <Link href="/register?type=admin" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'inline-block' }}>
                            Admin Portal
                        </Link>
                    </div>
                </div>
                <div style={{ position: 'relative' }}>
                    {/* Placeholder for standard "Hero Image" - using emoji or div for now if no image asset */}
                    <div style={{
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
                        borderRadius: '20px',
                        padding: '3rem',
                        textAlign: 'center',
                        border: '2px dashed var(--color-sea-blue)'
                    }}>
                        <div style={{ fontSize: '8rem' }}>🏥</div>
                        <p style={{ color: 'var(--color-navy)', fontWeight: 'bold' }}>Dr. Kal&apos;s Virtual Hospital</p>
                    </div>
                </div>
            </section>

            {/* Features (Classic 3-col) */}
            <section className="features-grid" style={{ marginBottom: '5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2rem', color: 'var(--color-navy)' }}>Why Choose Us?</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Everything you need for better health management.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--color-sea-blue)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🩺</div>
                        <h3>Expert Care</h3>
                        <p>Access certified doctors, nurses, and specialists anytime.</p>
                    </div>
                    <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--color-sea-blue)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
                        <h3>Easy Scheduling</h3>
                        <p>Book video or in-person appointments in just a few clicks.</p>
                    </div>
                    <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--color-sea-blue)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                        <h3>Secure Records</h3>
                        <p>Your medical history is safe, encrypted, and accessible only to you.</p>
                    </div>
                </div>
            </section>



            {/* Bottom Section: Ad & News Feed */}
            <div className="ad-news-layout" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
                <div style={{ width: '100%' }}>
                    <AdBanner />
                </div>
                <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
                    <NewsFeed />
                </div>
            </div>
        </div>
    );
}
