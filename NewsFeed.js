"use client";
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function NewsFeed() {
    const [newsItems, setNewsItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        async function fetchNews() {
            try {
                const res = await fetch('/api/news');
                const data = await res.json();
                if (data.success) {
                    setNewsItems(data.data);
                }
            } catch (error) {
                console.error("Failed to load news", error);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    // Auto-slide every 7 seconds
    useEffect(() => {
        if (newsItems.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [newsItems.length]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + newsItems.length) % newsItems.length);
    };

    if (loading) return <div className="card text-center p-4">Loading updates...</div>;
    if (newsItems.length === 0) return null;

    const item = newsItems[currentIndex];

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', background: 'var(--color-sea-blue)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>📰 News</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={prevSlide} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>←</button>
                    <button onClick={nextSlide} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>→</button>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {item.imageUrl && (
                    <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                        <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}

                <div style={{ padding: '1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        {item.category && (
                            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                {item.category}
                            </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>
                            {formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}
                        </span>
                    </div>

                    <h4 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{item.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {item.summary}
                    </p>
                </div>
            </div>
        </div>
    );
}
