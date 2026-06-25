'use client';

import { Suspense, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconBrandGoogle, IconBrandTelegram, IconPhone, IconLock, IconUser, IconEye, IconEyeOff } from '@tabler/icons-react';
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
	const { user, loading, loginWithGoogle, loginWithTelegram, loginWithPhone, register } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const googleBtnRef = useRef<HTMLDivElement>(null);
	const tgContainerRef = useRef<HTMLDivElement>(null);

	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [phone, setPhone] = useState('+998 ');
	const [password, setPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (searchParams.get('mode') === 'register') {
			setMode('register');
		}
	}, [searchParams]);

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
		if (cleanPhone.length < 13 || !password) {
			setError('Telefon raqam va parolni kiriting');
			return;
		}
		setSubmitting(true);
		try {
			await loginWithPhone(cleanPhone, password);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Telefon raqam yoki parol noto'g'ri");
		} finally {
			setSubmitting(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		const cleanPhone = rawPhone(phone);
		if (!firstName.trim() || !lastName.trim() || cleanPhone.length < 13 || !password) {
			setError("Barcha maydonlarni to'ldiring");
			return;
		}
		if (password.length < 6) {
			setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
			return;
		}
		if (password !== confirmPassword) {
			setError('Parollar mos kelmaydi');
			return;
		}
		setSubmitting(true);
		try {
			await register({
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				phone: cleanPhone,
				password,
			});
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Ro'yxatdan o'tishda xatolik");
		} finally {
			setSubmitting(false);
		}
	};

	const switchMode = (newMode: 'login' | 'register') => {
		setMode(newMode);
		setError('');
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
					<h1 className='text-lg sm:text-xl font-bold text-slate-900 text-center mb-1'>
						{mode === 'login' ? 'Xush kelibsiz!' : "Ro'yxatdan o'tish"}
					</h1>
					<p className='text-[13px] sm:text-sm text-slate-500 text-center mb-6'>
						{mode === 'login'
							? 'Testlarni ishlash uchun tizimga kiring'
							: "Yangi hisob yarating va testlarni ishlang"}
					</p>

					{/* Error */}
					{error && (
						<div className='mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center'>
							{error}
						</div>
					)}

					{/* Phone + Password Form */}
					{mode === 'login' ? (
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
							<div className='relative'>
								<IconLock size={18} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
								<input
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder='Parol'
									className='w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
								>
									{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
								</button>
							</div>
							<button
								type='submit'
								disabled={submitting}
								className='w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{submitting ? 'Kirilmoqda...' : 'Kirish'}
							</button>
						</form>
					) : (
						<form onSubmit={handleRegister} className='space-y-3'>
							<div className='grid grid-cols-2 gap-3'>
								<div className='relative'>
									<IconUser size={18} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
									<input
										type='text'
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										placeholder='Ism'
										className='w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
									/>
								</div>
								<div>
									<input
										type='text'
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										placeholder='Familiya'
										className='w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
									/>
								</div>
							</div>
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
							<div className='relative'>
								<IconLock size={18} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
								<input
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder='Parol (kamida 6 ta belgi)'
									className='w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
								>
									{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
								</button>
							</div>
							<div className='relative'>
								<IconLock size={18} className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400' />
								<input
									type={showPassword ? 'text' : 'password'}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder='Parolni tasdiqlang'
									className='w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'
								/>
							</div>
							<button
								type='submit'
								disabled={submitting}
								className='w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{submitting ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
							</button>
						</form>
					)}

					{/* Toggle login/register */}
					<div className='text-center mt-4'>
						{mode === 'login' ? (
							<p className='text-sm text-slate-500'>
								Hisobingiz yo&apos;qmi?{' '}
								<button
									onClick={() => switchMode('register')}
									className='text-blue-600 hover:text-blue-700 font-semibold transition-colors'
								>
									Ro&apos;yxatdan o&apos;ting
								</button>
							</p>
						) : (
							<p className='text-sm text-slate-500'>
								Hisobingiz bormi?{' '}
								<button
									onClick={() => switchMode('login')}
									className='text-blue-600 hover:text-blue-700 font-semibold transition-colors'
								>
									Kirish
								</button>
							</p>
						)}
					</div>

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
