'use client';

import { useEffect, useState } from 'react';
import {
	Navbar,
	Hero,
	Stats,
	Subjects,
	MandatoryBlock,
	ComingSoon,
	HowItWorks,
	Features,
	SeoContent,
	CTA,
	Footer,
} from '@/components/sections';

interface Subject {
	id: number;
	name: string;
	icon: string;
	description: string;
	price_per_question: number;
	topic_count: number;
	question_count: number;
	is_mandatory: boolean;
	mandatory_question_count: number;
}

interface StatsData {
	total_users: number;
	total_questions: number;
	total_attempts: number;
	total_subjects: number;
}

export default function Home() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [mandatorySubjects, setMandatorySubjects] = useState<Subject[]>([]);
	const [stats, setStats] = useState<StatsData>({
		total_users: 0,
		total_questions: 0,
		total_attempts: 0,
		total_subjects: 0,
	});

	useEffect(() => {
		fetch('/api/subjects')
			.then((r) => r.json())
			.then((data) => {
				setSubjects(data.filter((s: Subject) => !s.is_mandatory));
				setMandatorySubjects(data.filter((s: Subject) => s.is_mandatory));
			})
			.catch(() => {});
		fetch('/api/stats/public')
			.then((r) => r.json())
			.then(setStats)
			.catch(() => {});
	}, []);
	return (
		<>
			<Navbar />
			<Hero />
			<Stats stats={stats} />
			<Subjects subjects={subjects} />
			<MandatoryBlock subjects={mandatorySubjects} />
			<ComingSoon />
			<HowItWorks />
			<Features />
			<SeoContent />
			<CTA />
			<Footer />
		</>
	);
}
