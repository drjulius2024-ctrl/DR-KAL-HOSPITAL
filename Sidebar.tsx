export interface SidebarItem {
    name: string;
    icon: string;
    id: string;
}

interface SidebarProps {
    role: string;
    isOpen: boolean;
    toggle: () => void;
    items?: SidebarItem[];
    activeTab?: string;
    onTabChange?: (id: string) => void;
}

export default function Sidebar({ role, isOpen, toggle, items, activeTab, onTabChange }: SidebarProps) {
    const defaultItems = [
        { name: 'Overview', icon: '📊', id: 'overview' },
        { name: 'Patients', icon: '👥', id: 'patients' },
        { name: 'Schedule', icon: '📅', id: 'schedule' },
        { name: 'Messages', icon: '💬', id: 'messages' },
        { name: 'Settings', icon: '⚙️', id: 'settings' },
    ];

    const menuItems = items || defaultItems;

    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                <h2 className={`sidebar-title ${isOpen ? '' : 'hidden'}`}>
                    Dr. Kal's <span className="brand-highlight">VH</span>
                </h2>
                <button onClick={toggle} className="btn-secondary sidebar-toggle">
                    {isOpen ? '◀' : '▶'}
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`btn sidebar-btn ${!isOpen ? 'centered' : ''} ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange && onTabChange(item.id)}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        {isOpen && <span>{item.name}</span>}
                    </button>
                ))}
            </nav>
        </div>
    );
}
