'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
	role: 'bot' | 'user' | 'admin';
	text: string;
}

const GREETING = 'Assalomu alaykum! 👋\nTest Market platformasiga xush kelibsiz. Savol yoki takliflaringiz bo\'lsa, bemalol yozing!';

export default function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{ role: 'bot', text: GREETING },
	]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [escalated, setEscalated] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const sessionKey = useRef('');

	useEffect(() => {
		const key = 'chat_session_key';
		let val = localStorage.getItem(key);
		if (!val) {
			val = crypto.randomUUID();
			localStorage.setItem(key, val);
		}
		sessionKey.current = val;
	}, []);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, open]);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const syncMessages = useCallback(() => {
		fetch(`/api/chat/messages?session_key=${sessionKey.current}`)
			.then((r) => r.json())
			.then((data) => {
				if (data.messages && data.messages.length > 0) {
					setMessages([
						{ role: 'bot', text: GREETING },
						...data.messages.map((m: { role: string; text: string }) => ({
							role: m.role as Message['role'],
							text: m.text,
						})),
					]);
				}
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!open || !escalated) return;
		const interval = setInterval(syncMessages, 5000);
		return () => clearInterval(interval);
	}, [open, escalated, syncMessages]);

	const send = async () => {
		const text = input.trim();
		if (!text || loading) return;

		setInput('');
		setMessages((prev) => [...prev, { role: 'user', text }]);
		setLoading(true);

		try {
			const res = await fetch('/api/chat/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, session_key: sessionKey.current }),
			});
			const data = await res.json();
			if (data.escalated) setEscalated(true);
			setMessages((prev) => [
				...prev,
				{ role: data.escalated ? 'bot' : 'bot', text: data.reply || 'Kechirasiz, xatolik yuz berdi.' },
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{ role: 'bot', text: 'Tarmoq xatosi. Qaytadan urinib ko\'ring.' },
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{open && (
				<div className='cw-window'>
					<div className='cw-header'>
						<div className='cw-header__info'>
							<div className='cw-avatar'>
								<svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
									<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
								</svg>
							</div>
							<div>
								<div className='cw-header__title'>Test Market Yordam</div>
								<div className='cw-header__status'>
									{escalated ? 'Admin javobini kutmoqda...' : 'Online'}
								</div>
							</div>
						</div>
						<button className='cw-header__close' onClick={() => setOpen(false)}>
							<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<line x1='18' y1='6' x2='6' y2='18' />
								<line x1='6' y1='6' x2='18' y2='18' />
							</svg>
						</button>
					</div>

					<div className='cw-messages'>
						{messages.map((m, i) => (
							<div key={i} className={`cw-msg cw-msg--${m.role === 'admin' ? 'bot' : m.role}`}>
								<div className={`cw-bubble cw-bubble--${m.role === 'admin' ? 'admin' : m.role}`}>
									{m.role === 'admin' && (
										<div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.85 }}>
											👤 Operator
										</div>
									)}
									{m.text.split('\n').map((line, j) => (
										<span key={j}>
											{line}
											{j < m.text.split('\n').length - 1 && <br />}
										</span>
									))}
								</div>
							</div>
						))}
						{loading && (
							<div className='cw-msg cw-msg--bot'>
								<div className='cw-bubble cw-bubble--bot cw-typing'>
									<span /><span /><span />
								</div>
							</div>
						)}
						<div ref={bottomRef} />
					</div>

					<div className='cw-input-area'>
						<input
							ref={inputRef}
							className='cw-input'
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && send()}
							placeholder='Xabar yozing...'
							maxLength={1000}
							disabled={loading}
						/>
						<button className='cw-send' onClick={send} disabled={!input.trim() || loading}>
							<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<line x1='22' y1='2' x2='11' y2='13' />
								<polygon points='22 2 15 22 11 13 2 9 22 2' />
							</svg>
						</button>
					</div>
				</div>
			)}

			<button className={`cw-toggle ${open ? 'cw-toggle--open' : ''}`} onClick={() => setOpen(!open)}>
				{open ? (
					<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<line x1='18' y1='6' x2='6' y2='18' />
						<line x1='6' y1='6' x2='18' y2='18' />
					</svg>
				) : (
					<svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
				)}
			</button>
		</>
	);
}
