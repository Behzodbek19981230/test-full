import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';
import {
	IconLayoutDashboard,
	IconCreditCard,
	IconBooks,
	IconClipboardCheck,
	IconUsers,
	IconBell,
	IconFileText,
	IconLogout,
	IconSend,
} from '@tabler/icons-react';

export default function Layout() {
	const { admin, logout } = useAuth();
	const [pendingCount, setPendingCount] = useState(0);

	useEffect(() => {
		const fetchPending = () => {
			api.get('/payments/pending/count')
				.then((r) => setPendingCount(r.data.count))
				.catch(() => {});
		};
		fetchPending();
		const interval = setInterval(fetchPending, 30000);
		return () => clearInterval(interval);
	}, []);

	const navItems: {
		section: string;
		items: { to: string; icon: typeof IconLayoutDashboard; label: string; end?: boolean; badge?: number }[];
	}[] = [
		{
			section: 'Asosiy',
			items: [
				{ to: '/', icon: IconLayoutDashboard, label: 'Dashboard', end: true },
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
			items: [
				{ to: '/users', icon: IconUsers, label: 'Foydalanuvchilar' },
				{ to: '/notifications', icon: IconBell, label: 'Bildirishnomalar' },
				{ to: '/audit', icon: IconFileText, label: 'Audit Log' },
			],
		},
	];

	return (
		<div className='layout'>
			<aside className='sidebar'>
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
					{navItems.map((group) => (
						<div key={group.section}>
							<div className='sidebar-section'>{group.section}</div>
							<ul>
								{group.items.map((item) => (
									<li key={item.to}>
										<NavLink to={item.to} end={item.end}>
											<item.icon size={20} className='nav-icon' />
											{item.label}
											{item.badge && item.badge > 0 && (
												<span className='nav-badge'>{item.badge}</span>
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
							<div className='sidebar-user-role'>Administrator</div>
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
