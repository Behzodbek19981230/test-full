'use client';

import { Suspense, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconBrandGoogle, IconBrandTelegram } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: Record<string, unknown>) => void;
					renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
				};
			};
		};
		onTelegramAuth?: (user: Record<string, unknown>) => void;
	}
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';

function getPostLoginRedirect(params: URLSearchParams): string {
	if (params.get('redirect') === 'bot' && params.get('subject')) {
		return `https://t.me/${TELEGRAM_BOT_NAME}?start=sub_${params.get('subject')}`;
	}
	return '/';
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-slate-50'>
					<div className='quiz-loading__spinner' />
				</div>
			}
		>
			<LoginContent />
		</Suspense>
	);
}

function LoginContent() {
	const { user, loading, loginWithGoogle, loginWithTelegram } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const googleBtnRef = useRef<HTMLDivElement>(null);
	const tgContainerRef = useRef<HTMLDivElement>(null);

	const redirectAfterLogin = () => {
		const target = getPostLoginRedirect(searchParams);
		if (target.startsWith('http')) {
			window.open(target, '_blank');
			router.push('/');
		} else {
			router.push(target);
		}
	};

	useEffect(() => {
		if (!loading && user) {
			redirectAfterLogin();
		}
	}, [user, loading]);

	// Google Sign-In
	useEffect(() => {
		if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.onload = () => {
			window.google?.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: handleGoogleResponse,
			});
			if (googleBtnRef.current) {
				window.google?.accounts.id.renderButton(googleBtnRef.current, {
					theme: 'outline',
					size: 'large',
					width: '100%',
					text: 'continue_with',
					shape: 'pill',
				});
			}
		};
		document.head.appendChild(script);
		return () => {
			script.remove();
		};
	}, [loading]);

	const handleGoogleResponse = useCallback(
		async (response: { credential: string }) => {
			try {
				await loginWithGoogle(response.credential);
			} catch {
				alert('Google orqali kirishda xatolik');
			}
		},
		[loginWithGoogle],
	);

	// Telegram Login
	useEffect(() => {
		if (!TELEGRAM_BOT_NAME || !tgContainerRef.current) return;

		window.onTelegramAuth = async (tgUser: Record<string, unknown>) => {
			try {
				await loginWithTelegram(tgUser);
			} catch {
				alert('Telegram orqali kirishda xatolik');
			}
		};

		const script = document.createElement('script');
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
		script.setAttribute('data-size', 'large');
		script.setAttribute('data-radius', '20');
		script.setAttribute('data-onauth', 'onTelegramAuth(user)');
		script.setAttribute('data-request-access', 'write');
		script.async = true;
		tgContainerRef.current.appendChild(script);
	}, [loading]);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-slate-50'>
				<div className='quiz-loading__spinner' />
			</div>
		);
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-slate-50 px-4'>
			<div className='w-full max-w-[400px]'>
				{/* Logo */}
				<div className='text-center mb-8'>
					<Link href='/' className='inline-flex items-center gap-2.5 text-2xl font-extrabold'>
						<img src='/logo.png' alt='Test Market' className='w-15 h-15 rounded-xl object-contain' />
						<span className='bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent'>
							Test Market
						</span>
					</Link>
					<p className='text-slate-500 text-sm mt-3'>Tizimga kirish</p>
				</div>

				{/* Card */}
				<div className='bg-white border border-slate-200 shadow-lg rounded-3xl p-8'>
					<h1 className='text-xl font-bold text-slate-900 text-center mb-2'>Xush kelibsiz!</h1>
					<p className='text-sm text-slate-500 text-center mb-8'>Testlarni ishlash uchun tizimga kiring</p>

					{/* Google */}
					{GOOGLE_CLIENT_ID && (
						<div className='mb-4'>
							<div ref={googleBtnRef} className='flex justify-center' />
						</div>
					)}

					{/* Custom Google button fallback (if no client ID) */}
					{!GOOGLE_CLIENT_ID && (
						<button
							disabled
							className='w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed opacity-50'
						>
							<IconBrandGoogle size={20} />
							Google bilan kirish (sozlanmagan)
						</button>
					)}

					{/* Divider */}
					<div className='flex items-center gap-3 my-6'>
						<div className='flex-1 h-px bg-slate-200' />
						<span className='text-xs text-slate-400 font-medium'>yoki</span>
						<div className='flex-1 h-px bg-slate-200' />
					</div>

					{/* Telegram */}
					{TELEGRAM_BOT_NAME ? (
						<div className='flex justify-center' ref={tgContainerRef} />
					) : (
						<button
							disabled
							className='w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed opacity-50'
						>
							<IconBrandTelegram size={20} />
							Telegram bilan kirish (sozlanmagan)
						</button>
					)}
				</div>

				{/* Back */}
				<div className='text-center mt-6'>
					<Link href='/' className='text-sm text-slate-500 hover:text-slate-700 transition-colors'>
						← Bosh sahifaga qaytish
					</Link>
				</div>
			</div>
		</div>
	);
}
