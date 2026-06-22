'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MathHTML from '@/components/MathRenderer';

interface Subject {
	id: number;
	name: string;
	icon: string;
}

interface Question {
	id: number;
	question_text: string;
	option_a: string;
	option_b: string;
	option_c: string;
	option_d: string;
}

interface QuizResult {
	id: number;
	question_text: string;
	option_a: string;
	option_b: string;
	option_c: string;
	option_d: string;
	correct_option: string;
	user_answer: string;
	is_correct: boolean;
}

interface CheckResponse {
	total: number;
	correct: number;
	incorrect: number;
	score: number;
	results: QuizResult[];
}

type Phase = 'loading' | 'quiz' | 'result';

const OPTIONS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'] as const;
const TOTAL_TIME = 45 * 60; // 45 daqiqa

export default function QuizPage() {
	const params = useParams();
	const subjectId = params.subjectId as string;

	const [phase, setPhase] = useState<Phase>('loading');
	const [subject, setSubject] = useState<Subject | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
	const [result, setResult] = useState<CheckResponse | null>(null);
	const [checking, setChecking] = useState(false);
	const [currentQ, setCurrentQ] = useState(0);

	// Load quiz
	useEffect(() => {
		fetch(`/api/quiz/${subjectId}/generate?count=30`)
			.then((r) => {
				if (!r.ok) throw new Error('Xato');
				return r.json();
			})
			.then((data) => {
				setSubject(data.subject);
				setQuestions(data.questions);
				setPhase('quiz');
			})
			.catch(() => setPhase('loading'));
	}, [subjectId]);

	// Timer
	useEffect(() => {
		if (phase !== 'quiz') return;
		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					handleFinish();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [phase]);

	const handleAnswer = (qId: number, option: string) => {
		setAnswers((prev) => ({ ...prev, [qId]: option }));
	};

	const handleFinish = useCallback(async () => {
		if (checking) return;
		setChecking(true);
		try {
			const res = await fetch(`/api/quiz/${subjectId}/check`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answers }),
			});
			const data = await res.json();
			setResult(data);
			setPhase('result');
		} catch {
			alert('Xatolik yuz berdi');
		} finally {
			setChecking(false);
		}
	}, [answers, subjectId, checking]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	};

	const answeredCount = Object.keys(answers).length;

	// Loading
	if (phase === 'loading') {
		return (
			<div className='quiz-page'>
				<div className='quiz-loading'>
					<div className='quiz-loading__spinner' />
					<p>Test yuklanmoqda...</p>
				</div>
			</div>
		);
	}

	// Result
	if (phase === 'result' && result) {
		return (
			<div className='quiz-page'>
				<div className='quiz-result'>
					<div className='quiz-result__header'>
						<h1>Test yakunlandi!</h1>
						<p>{subject?.name}</p>
					</div>

					<div className='quiz-result__stats'>
						<div className='quiz-result__score'>
							<div
								className='quiz-result__score-circle'
								data-score={result.score >= 70 ? 'good' : result.score >= 50 ? 'mid' : 'low'}
							>
								<span className='quiz-result__score-num'>{result.score}%</span>
							</div>
						</div>
						<div className='quiz-result__counts'>
							<div className='quiz-result__count quiz-result__count--correct'>
								<span className='quiz-result__count-num'>{result.correct}</span>
								<span>To'g'ri</span>
							</div>
							<div className='quiz-result__count quiz-result__count--incorrect'>
								<span className='quiz-result__count-num'>{result.incorrect}</span>
								<span>Noto'g'ri</span>
							</div>
							<div className='quiz-result__count quiz-result__count--total'>
								<span className='quiz-result__count-num'>{result.total}</span>
								<span>Jami</span>
							</div>
						</div>
					</div>

					{/* Questions review */}
					<div className='quiz-result__review'>
						<h2>Batafsil natija</h2>
						{result?.results?.map((r, idx) => (
							<div
								key={r.id}
								className={`quiz-review-card ${r.is_correct ? 'quiz-review-card--correct' : 'quiz-review-card--wrong'}`}
							>
								<div className='quiz-review-card__header'>
									<span className='quiz-review-card__num'>{idx + 1}</span>
									<span
										className={`quiz-review-card__badge ${r.is_correct ? 'quiz-review-card__badge--correct' : 'quiz-review-card__badge--wrong'}`}
									>
										{r.is_correct ? "✓ To'g'ri" : "✗ Noto'g'ri"}
									</span>
								</div>
								<div className='quiz-review-card__text'>
									<MathHTML html={r.question_text} />
								</div>
								<div className='quiz-review-card__options'>
									{OPTIONS.map((opt, i) => {
										const isCorrect = r.correct_option === opt;
										const isUser = r.user_answer === opt;
										let cls = 'quiz-review-opt';
										if (isCorrect) cls += ' quiz-review-opt--correct';
										if (isUser && !isCorrect) cls += ' quiz-review-opt--wrong';
										return (
											<div key={opt} className={cls}>
												<span className='quiz-review-opt__letter'>{opt}</span>
												<MathHTML html={r[OPTION_KEYS[i]]} />
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>

					<div className='quiz-result__actions'>
						<Link href='/#fanlar' className='quiz-btn quiz-btn--ghost'>
							Bosh sahifaga
						</Link>
						<button className='quiz-btn quiz-btn--primary' onClick={() => window.location.reload()}>
							Qayta ishlash
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Quiz
	const q = questions[currentQ];

	return (
		<div className='quiz-page'>
			{/* Top bar */}
			<div className='quiz-topbar'>
				<div className='quiz-topbar__left'>
					<Link href='/#fanlar' className='quiz-topbar__back'>
						← Chiqish
					</Link>
					<span className='quiz-topbar__subject'>{subject?.name}</span>
				</div>
				<div className='quiz-topbar__center'>
					<span className='quiz-topbar__progress'>
						{answeredCount}/{questions.length} javob
					</span>
				</div>
				<div className={`quiz-topbar__timer ${timeLeft < 300 ? 'quiz-topbar__timer--danger' : ''}`}>
					{formatTime(timeLeft)}
				</div>
			</div>

			<div className='quiz-body'>
				{/* Question navigation (side) */}
				<div className='quiz-nav'>
					<div className='quiz-nav__grid'>
						{questions.map((qst, idx) => (
							<button
								key={qst.id}
								className={`quiz-nav__btn ${idx === currentQ ? 'quiz-nav__btn--active' : ''} ${answers[qst.id] ? 'quiz-nav__btn--answered' : ''}`}
								onClick={() => setCurrentQ(idx)}
							>
								{idx + 1}
							</button>
						))}
					</div>
					<button
						className='quiz-btn quiz-btn--primary quiz-btn--full'
						onClick={handleFinish}
						disabled={checking}
					>
						{checking ? 'Tekshirilmoqda...' : 'Yakunlash'}
					</button>
				</div>

				{/* Main question area */}
				<div className='quiz-main'>
					<div className='quiz-question'>
						<div className='quiz-question__header'>
							<span className='quiz-question__num'>{currentQ + 1}-savol</span>
							<span className='quiz-question__of'>/ {questions.length}</span>
						</div>
						<div className='quiz-question__text'>
							<MathHTML html={q.question_text} />
						</div>

						<div className='quiz-options'>
							{OPTIONS.map((opt, i) => {
								const isSelected = answers[q.id] === opt;
								return (
									<button
										key={opt}
										className={`quiz-option ${isSelected ? 'quiz-option--selected' : ''}`}
										onClick={() => handleAnswer(q.id, opt)}
									>
										<span
											className={`quiz-option__letter ${isSelected ? 'quiz-option__letter--selected' : ''}`}
										>
											{opt}
										</span>
										<span className='quiz-option__text'>
											<MathHTML html={q[OPTION_KEYS[i]]} />
										</span>
									</button>
								);
							})}
						</div>

						{/* Nav buttons */}
						<div className='quiz-question__nav'>
							<button
								className='quiz-btn quiz-btn--ghost'
								disabled={currentQ === 0}
								onClick={() => setCurrentQ((prev) => prev - 1)}
							>
								← Oldingi
							</button>
							<button
								className='quiz-btn quiz-btn--ghost'
								disabled={currentQ === questions.length - 1}
								onClick={() => setCurrentQ((prev) => prev + 1)}
							>
								Keyingi →
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
