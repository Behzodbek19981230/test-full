import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';
import {
	IconHome,
	IconChartBar,
	IconCreditCard,
	IconBooks,
	IconClipboardCheck,
	IconUsers,
	IconBell,
	IconFileText,
	IconLogout,
	IconSend,
	IconMenu2,
	IconX,
} from '@tabler/icons-react';

export default function Layout() {
	const { admin, logout } = useAuth();
	const [pendingCount, setPendingCount] = useState(0);
	const [unreadNotifs, setUnreadNotifs] = useState(0);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();

	useEffect(() => {
		setSidebarOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		if (sidebarOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => { document.body.style.overflow = ''; };
	}, [sidebarOpen]);

	useEffect(() => {
		const fetchCounts = () => {
			api.get('/payments/pending/count')
				.then((r) => setPendingCount(r.data.count))
				.catch(() => {});
			api.get('/notifications?per_page=1')
				.then((r) => setUnreadNotifs(r.data.unread_count || 0))
				.catch(() => {});
		};
		fetchCounts();
		const interval = setInterval(fetchCounts, 30000);
		return () => clearInterval(interval);
	}, []);

	const isAdmin = admin?.role === 'admin' || admin?.role === 'superadmin';

	const allNavItems: {
		section: string;
		adminOnly?: boolean;
		items: {
			to: string;
			icon: typeof IconHome;
			label: string;
			end?: boolean;
			badge?: number;
			badgeColor?: 'warning' | 'danger';
			adminOnly?: boolean;
		}[];
	}[] = [
		{
			section: '',
			items: [
				{ to: '/', icon: IconHome, label: 'Bosh sahifa', end: true },
			],
		},
		{
			section: 'Asosiy',
			adminOnly: true,
			items: [
				{ to: '/dashboard', icon: IconChartBar, label: 'Dashboard' },
				{ to: '/payments', icon: IconCreditCard, label: "To'lovlar", badge: pendingCount || undefined },
				{ to: '/variants', icon: IconSend, label: 'Variantlar' },
			],
		},
		{
			section: 'Kontent',
			items: [
				{ to: '/subjects', icon: IconBooks, label: 'Fanlar' },
				{ to: '/tests', icon: IconClipboardCheck, label: 'Testlar' },
			],
		},
		{
			section: 'Boshqaruv',
			adminOnly: true,
			items: [
				{ to: '/users', icon: IconUsers, label: 'Foydalanuvchilar' },
				{ to: '/admin-users', icon: IconUsers, label: 'Admin foydalanuvchilar' },
				{
					to: '/notifications',
					icon: IconBell,
					label: 'Bildirishnomalar',
					badge: unreadNotifs || undefined,
					badgeColor: 'danger',
				},
				{ to: '/audit', icon: IconFileText, label: 'Audit Log' },
			],
		},
	];

	const navItems = allNavItems
		.filter(g => !g.adminOnly || isAdmin)
		.map(g => ({
			...g,
			items: g.items.filter(i => !i.adminOnly || isAdmin),
		}));

	return (
		<div className='layout'>
			{/* Mobile topbar */}
			<header className='mobile-topbar'>
				<button className='mobile-topbar-btn' onClick={() => setSidebarOpen(true)}>
					<IconMenu2 size={22} />
				</button>
				<span className='mobile-topbar-title'>Test Market</span>
				<div style={{ width: 36 }} />
			</header>

			{/* Mobile overlay */}
			{sidebarOpen && <div className='sidebar-overlay' onClick={() => setSidebarOpen(false)} />}

			{/* Sidebar */}
			<aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
				<button className='sidebar-close' onClick={() => setSidebarOpen(false)}>
					<IconX size={20} />
				</button>
				<div className='sidebar-header'>
					<div className='sidebar-logo'>
						<img
							src='/logo.png'
							alt='Test Market'
							style={{ width: 100, height: 80, borderRadius: 6, objectFit: 'cover' }}
						/>
					</div>
				</div>

				<nav className='sidebar-nav'>
					{navItems.map((group, gi) => (
						<div key={group.section || gi}>
							{group.section && <div className='sidebar-section'>{group.section}</div>}
							<ul>
								{group.items.map((item) => (
									<li key={item.to}>
										<NavLink to={item.to} end={item.end}>
											<item.icon size={20} className='nav-icon' />
											{item.label}
											{item.badge && item.badge > 0 && (
												<span
													className={`nav-badge ${item.badgeColor === 'danger' ? 'nav-badge--danger' : ''}`}
												>
													{item.badge}
												</span>
											)}
										</NavLink>
									</li>
								))}
							</ul>
						</div>
					))}
				</nav>

				<div className='sidebar-footer'>
					<div className='sidebar-user'>
						<div className='sidebar-user-avatar'>{admin?.full_name?.charAt(0) || 'A'}</div>
						<div className='sidebar-user-info'>
							<div className='sidebar-user-name'>{admin?.full_name}</div>
							<div className='sidebar-user-role'>{admin?.role === 'teacher' ? 'O\'qituvchi' : 'Administrator'}</div>
						</div>
						<button className='sidebar-logout' onClick={logout} title='Chiqish'>
							<IconLogout size={18} />
						</button>
					</div>
				</div>
			</aside>

			<main className='main-content'>
				<Outlet />
			</main>
		</div>
	);
}
