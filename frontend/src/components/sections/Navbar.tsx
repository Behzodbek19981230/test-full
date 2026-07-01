'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconMenu2, IconX, IconLogin, IconLogout } from '@tabler/icons-react';
import { Container } from '../ui';
import { useAuth } from '@/context/AuthContext';

const links = [
	{ href: '#fanlar', label: 'Fanlar' },
	{ href: '#majburiy', label: 'Majburiy fanlar' },
	{ href: '#gmat-gre', label: 'GMAT & GRE' },
	{ href: '#qanday', label: 'Qanday ishlaydi' },
	{ href: '#imkoniyatlar', label: 'Imkoniyatlar' },
];

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);
	const { user, loading, logout } = useAuth();

	useEffect(() => {
		const fn = () => setScrolled(window.scrollY > 20);
		window.addEventListener('scroll', fn);
		return () => window.removeEventListener('scroll', fn);
	}, []);

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${scrolled ? 'backdrop-blur-xl border-b border-slate-200' : ''}`}
		>
			<Container>
				<div className='flex items-center justify-between h-[60px] sm:h-[72px]'>
					<a
						href='/'
						className='flex items-center gap-2'
						style={{ fontFamily: "'Space Grotesk', sans-serif" }}
					>
						<img
							src='/icon.png'
							alt='Test Market'
							className='w-10 h-10 sm:w-18 sm:h-18 rounded-lg sm:rounded-[10px] object-contain'
						/>
						<span className='text-lg sm:text-[22px] font-bold tracking-[-0.5px]'>
							<span className='text-slate-800'>Test</span>
							<span className='bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent'>
								Market
							</span>
						</span>
					</a>

					<ul className='hidden md:flex items-center gap-2'>
						{links.map((l) => (
							<li key={l.href}>
								<a
									href={l.href}
									className='px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all'
								>
									{l.label}
								</a>
							</li>
						))}
					</ul>

					<div className='flex items-center gap-2 sm:gap-3'>
						{!loading &&
							(user ? (
								<div className='flex items-center gap-2 sm:gap-3'>
									<div className='flex items-center gap-2'>
										{user.avatar ? (
											<img
												src={user.avatar}
												alt=''
												className='w-8 h-8 rounded-full object-cover'
												referrerPolicy='no-referrer'
											/>
										) : (
											<div className='w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold'>
												{user.full_name.charAt(0)}
											</div>
										)}
										<span className='hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate'>
											{user.full_name}
										</span>
									</div>
									<button
										onClick={logout}
										className='p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all'
										title='Chiqish'
									>
										<IconLogout size={18} />
									</button>
								</div>
							) : (
								<Link
									href='/login'
									className='flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all'
								>
									<IconLogin size={16} /> Kirish
								</Link>
							))}
						<button className='md:hidden text-slate-700 p-1.5' onClick={() => setOpen(!open)}>
							{open ? <IconX size={22} /> : <IconMenu2 size={22} />}
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				<div
					className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-4' : 'max-h-0'}`}
				>
					<div className='flex flex-col gap-1 pt-1 border-t border-slate-100'>
						{links.map((l) => (
							<a
								key={l.href}
								href={l.href}
								onClick={() => setOpen(false)}
								className='px-4 py-3 rounded-xl text-[15px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all active:bg-slate-100'
							>
								{l.label}
							</a>
						))}
					</div>
				</div>
			</Container>
		</nav>
	);
}
