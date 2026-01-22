import React from 'react';

interface TopBarProps {
    userName: string;
    role: string;
    onAvatarClick?: () => void;
    avatarUrl?: string; // [NEW]
}

export default function TopBar({ userName, role, onAvatarClick, avatarUrl }: TopBarProps) {
    return (
        <header className="glass-nav topbar-header">
            {/* Search Bar */}
            <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search patients, records, or tests..."
                    className="input-field input-search"
                />
            </div>

            {/* User Profile */}
            <div className="user-profile">
                <button className="btn-secondary icon-btn">
                    🔔
                </button>
                <div className="user-info">
                    <div className="user-name">{userName}</div>
                    <div className="user-role">{role}</div>
                </div>
                <div
                    className="user-avatar-circle"
                    onClick={onAvatarClick}
                    title="Edit Profile"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="User Avatar" className="user-avatar-image" />
                    ) : (
                        "👤"
                    )}
                </div>
            </div>
        </header>
    );
}
