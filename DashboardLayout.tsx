import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

import { SidebarItem } from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: 'doctor' | 'nurse' | 'pharmacist' | 'dietician' | 'psychologist' | 'admin' | 'scientist';
    userName?: string;
    sidebarItems?: SidebarItem[];
    activeTab?: string;
    onTabChange?: (id: string) => void;
    onAvatarClick?: () => void; // [NEW]
    avatarUrl?: string; // [NEW]
}

export default function DashboardLayout({ children, role, userName = 'Dr. Kal', avatarUrl, sidebarItems, activeTab, onTabChange, onAvatarClick }: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="dashboard-grid">
            {/* Sidebar Column */}
            <aside className={`dashboard-sidebar glass-panel ${isSidebarOpen ? '' : 'collapsed'}`}>
                <Sidebar
                    role={role}
                    isOpen={isSidebarOpen}
                    toggle={toggleSidebar}
                    items={sidebarItems}
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                />
            </aside>

            {/* Main Content Column */}
            <main className="dashboard-main">
                <TopBar userName={userName} role={role} onAvatarClick={onAvatarClick} avatarUrl={avatarUrl} />
                <div className="dashboard-content">
                    <div className="animate-fade-in">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
