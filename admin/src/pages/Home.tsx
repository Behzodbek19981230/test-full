import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
	IconBooks,
	IconClipboardCheck,
	IconChartBar,
	IconCreditCard,
	IconUsers,
	IconArrowRight,
} from '@tabler/icons-react';

export default function Home() {
	const { admin } = useAuth();
	const navigate = useNavigate();
	const isAdmin = admin?.role === 'admin' || admin?.role === 'superadmin';

	const hour = new Date().getHours();
	const greeting = hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech';

	const shortcuts = [
		...(isAdmin
			? [{ icon: IconChartBar, label: 'Dashboard', desc: 'Statistika va grafiklar', to: '/dashboard', color: 'var(--primary)', bg: 'var(--primary-50)' }]
			: []),
		{ icon: IconBooks, label: 'Fanlar', desc: 'Fanlarni boshqarish', to: '/subjects', color: 'var(--info)', bg: 'var(--info-50)' },
		{ icon: IconClipboardCheck, label: 'Testlar', desc: 'Test bazasini boshqarish', to: '/tests', color: 'var(--success)', bg: 'var(--success-50)' },
		...(isAdmin
			? [
					{ icon: IconCreditCard, label: "To'lovlar", desc: "To'lovlarni ko'rish", to: '/payments', color: 'var(--warning)', bg: 'var(--warning-50)' },
					{ icon: IconUsers, label: 'Foydalanuvchilar', desc: "Foydalanuvchilarni boshqarish", to: '/users', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
				]
			: []),
	];

	return (
		<div className='home-page'>
			<div className='home-banner'>
				<div className='home-banner__bg' />
				<div className='home-banner__content'>
					<div className='home-banner__icon'>
						<img src='/logo.png' alt='Test Market' />
					</div>
					<h1 className='home-banner__title'>
						{greeting}, {admin?.full_name?.split(' ')[0]}!
					</h1>
					<p className='home-banner__subtitle'>
						Test Market admin paneliga xush kelibsiz. Quyidagi bo'limlardan birini tanlang.
					</p>
				</div>
			</div>

			<div className='home-shortcuts'>
				{shortcuts.map((s) => (
					<button key={s.to} className='home-shortcut' onClick={() => navigate(s.to)}>
						<div className='home-shortcut__icon' style={{ background: s.bg, color: s.color }}>
							<s.icon size={24} />
						</div>
						<div className='home-shortcut__info'>
							<h3>{s.label}</h3>
							<p>{s.desc}</p>
						</div>
						<IconArrowRight size={18} className='home-shortcut__arrow' />
					</button>
				))}
			</div>
		</div>
	);
}
