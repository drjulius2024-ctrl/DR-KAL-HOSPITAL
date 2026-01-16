"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // This will be dynamic based on Auth state
    const isLoggedIn = !!user;

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 0'
        }}>
            <div className="container nav-container">
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-sea-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src="/logo.png" alt="Dr Kal Logo" style={{ height: '80px' }} />
                    <span>Dr Kal's</span>
                </Link>

                <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center', width: '100%' }}>
                    {/* Main Nav Links - Left Aligned */}
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <Link href="/" style={{ color: pathname === '/' ? 'var(--color-navy)' : 'var(--text-secondary)', fontWeight: pathname === '/' ? 'bold' : 'normal' }}>Home</Link>
                        <Link href="/services" style={{ color: pathname === '/services' ? 'var(--color-navy)' : 'var(--text-secondary)', fontWeight: pathname === '/services' ? 'bold' : 'normal' }}>Services</Link>
                        <Link href="/about" style={{ color: pathname === '/about' ? 'var(--color-navy)' : 'var(--text-secondary)', fontWeight: pathname === '/about' ? 'bold' : 'normal' }}>About</Link>
                        <Link href="/vision" style={{ color: pathname === '/vision' ? 'var(--color-navy)' : 'var(--text-secondary)', fontWeight: pathname === '/vision' ? 'bold' : 'normal' }}>Vision</Link>
                        <Link href="/mission" style={{ color: pathname === '/mission' ? 'var(--color-navy)' : 'var(--text-secondary)', fontWeight: pathname === '/mission' ? 'bold' : 'normal' }}>Mission</Link>
                    </div>

                    {/* Action Buttons - Right Aligned via Auto Margin */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto', alignItems: 'center' }}>
                        <Link href="https://wa.me/233595441825" target="_blank" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                            <MessageCircle size={18} />
                            Help
                        </Link>
                        {isLoggedIn ? (
                            <button onClick={logout} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', background: '#dc2626', borderColor: '#dc2626' }}>Log Out</button>
                        ) : (
                            <Link href="/login" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Log In</Link>
                        )}
                        <Link href="/login?role=admin" style={{ fontSize: '0.8rem', color: '#999' }}>Admin</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
