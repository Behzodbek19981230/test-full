'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
	role: 'bot' | 'user';
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
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, open]);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

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
				body: JSON.stringify({ message: text }),
			});
			const data = await res.json();
			setMessages((prev) => [
				...prev,
				{ role: 'bot', text: data.reply || 'Kechirasiz, xatolik yuz berdi.' },
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
			{/* Chat window */}
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
								<div className='cw-header__status'>Online</div>
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
							<div key={i} className={`cw-msg cw-msg--${m.role}`}>
								<div className={`cw-bubble cw-bubble--${m.role}`}>
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

			{/* Toggle button */}
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
