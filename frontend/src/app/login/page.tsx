'use client';

import { Suspense, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconBrandGoogle, IconBrandTelegram, IconPhone } from '@tabler/icons-react';
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

function formatPhone(value: string): string {
	const digits = value.replace(/\D/g, '').slice(0, 12);
	if (!digits) return '+998 ';
	let result = '+';
	for (let i = 0; i < digits.length; i++) {
		if (i === 3 || i === 5 || i === 8 || i === 10) result += ' ';
		result += digits[i];
	}
	return result;
}

function rawPhone(formatted: string): string {
	return '+' + formatted.replace(/\D/g, '');
}

function getPostLoginRedirect(params: URLSearchParams): string {
	const redirect = params.get('redirect');
	const subject = params.get('subject');
	if (redirect === 'bot' && subject) {
		return `https://t.me/${TELEGRAM_BOT_NAME}?start=sub_${subject}`;
	}
	if (redirect === 'quiz' && subject) {
		return `/quiz/${subject}`;
	}
	return '/';
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-white'>
					<div className='quiz-loading__spinner' />
				</div>
			}
		>
			<LoginContent />
		</Suspense>
	);
}

function LoginContent() {
	const { user, loading, loginWithGoogle, loginWithTelegram, loginWithPhone } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const googleBtnRef = useRef<HTMLDivElement>(null);
	const tgContainerRef = useRef<HTMLDivElement>(null);

	const [phone, setPhone] = useState('+998 ');
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);

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
				setError('Google orqali kirishda xatolik');
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
				setError('Telegram orqali kirishda xatolik');
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

	const handlePhoneLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		const cleanPhone = rawPhone(phone);
		if (cleanPhone.length < 13) {
			setError('Telefon raqamni kiriting');
			return;
		}
		setSubmitting(true);
		try {
			await loginWithPhone(cleanPhone);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Kirishda xatolik yuz berdi');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-white'>
				<div className='quiz-loading__spinner' />
			</div>
		);
	}

	return (
		<div className='min-h-[100dvh] flex items-center justify-center bg-white px-4 py-8'>
			<div className='w-full max-w-[420px]'>
				{/* Logo */}
				<div className='text-center mb-6 sm:mb-8'>
					<Link href='/' className='inline-flex items-center gap-2.5 text-2xl font-extrabold'>
						<img src='/logo.png' alt='Test Market' className='w-36 h-36 sm:w-50 sm:h-50 rounded-xl object-contain' />
					</Link>
				</div>

				{/* Card */}
				<div className='bg-white border border-slate-200 shadow-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8'>
					<h1 className='text-lg sm:text-xl font-bold text-slate-900 text-center mb-1'>Xush kelibsiz!</h1>
					<p className='text-[13px] sm:text-sm text-slate-500 text-center mb-6'>
						Telefon raqamingizni kiriting
					</p>

					{/* Error */}
					{error && (
						<div className='mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center'>
							{error}
						</div>
					)}

					{/* Phone-only form */}
					<form onSubmit={handlePhoneLogin} className='space-y-3'>
						<div className='relative'>
							<IconPhone size={18} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
							<input
								type='tel'
								value={phone}
								onChange={(e) => setPhone(formatPhone(e.target.value))}
								placeholder='+998 90 123 45 67'
								className='w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
							/>
						</div>
						<button
							type='submit'
							disabled={submitting}
							className='w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{submitting ? 'Kirilmoqda...' : 'Kirish'}
						</button>
					</form>

					{/* Divider */}
					<div className='flex items-center gap-3 my-5'>
						<div className='flex-1 h-px bg-slate-200' />
						<span className='text-xs text-slate-400 font-medium'>yoki</span>
						<div className='flex-1 h-px bg-slate-200' />
					</div>

					{/* Social logins */}
					<div className='space-y-3'>
						{/* Google */}
						{GOOGLE_CLIENT_ID && (
							<div className='flex justify-center' ref={googleBtnRef} />
						)}
						{!GOOGLE_CLIENT_ID && (
							<button
								disabled
								className='w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-medium cursor-not-allowed opacity-50'
							>
								<IconBrandGoogle size={20} />
								Google bilan kirish (sozlanmagan)
							</button>
						)}

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
				</div>

				{/* Back */}
				<div className='text-center mt-6'>
					<Link href='/' className='text-sm text-slate-500 hover:text-slate-700 transition-colors'>
						&larr; Bosh sahifaga qaytish
					</Link>
				</div>
			</div>
		</div>
	);
}
