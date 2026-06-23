import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconBooks, IconPlus, IconEdit, IconBan, IconCheck, IconStarFilled } from '@tabler/icons-react';
import api from '../api';
import {
	PageHeader,
	Button,
	Dialog,
	Input,
	Textarea,
	Badge,
	Card,
	CardBody,
	DropdownMenu,
	IconPicker,
	SubjectIcon,
} from '../components/ui';
import Table from '../components/ui/Table';

interface Subject {
	id: number;
	name: string;
	description: string;
	icon: string;
	price_per_question: number;
	is_active: boolean;
	is_mandatory: boolean;
	mandatory_question_count: number;
	topic_count: number;
	question_count: number;
}

export default function Subjects() {
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState<Subject | null>(null);
	const [form, setForm] = useState({
		name: '', description: '', icon: '📚', price_per_question: 500,
		is_mandatory: false, mandatory_question_count: 10,
	});

	const load = () => api.get('/subjects/all').then((r) => setSubjects(r.data));
	useEffect(() => { load(); }, []);

	const openCreate = () => {
		setEditing(null);
		setForm({ name: '', description: '', icon: '📚', price_per_question: 500, is_mandatory: false, mandatory_question_count: 10 });
		setShowModal(true);
	};
	const openEdit = (s: Subject) => {
		setEditing(s);
		setForm({
			name: s.name, description: s.description || '', icon: s.icon, price_per_question: s.price_per_question,
			is_mandatory: s.is_mandatory || false, mandatory_question_count: s.mandatory_question_count || 10,
		});
		setShowModal(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editing) {
				await api.put(`/subjects/${editing.id}`, form);
				toast.success('Fan yangilandi');
			} else {
				await api.post('/subjects', form);
				toast.success('Fan yaratildi');
			}
			setShowModal(false);
			load();
		} catch {
			toast.error('Xatolik yuz berdi');
		}
	};

	const toggleActive = async (s: Subject) => {
		await api.put(`/subjects/${s.id}`, { is_active: !s.is_active });
		toast.success(s.is_active ? "Fan o'chirildi" : 'Fan yoqildi');
		load();
	};

	const toggleMandatory = async (s: Subject) => {
		await api.put(`/subjects/${s.id}`, { is_mandatory: !s.is_mandatory });
		toast.success(s.is_mandatory ? "Majburiylikdan chiqarildi" : 'Majburiy fanga aylandi');
		load();
	};

	return (
		<div>
			<PageHeader
				icon={<IconBooks size={22} />}
				iconColor='var(--info)'
				iconBg='var(--info-50)'
				title='Fanlar'
				actions={
					<Button onClick={openCreate}>
						<IconPlus size={18} /> Yangi fan
					</Button>
				}
			/>

			<Card>
				<CardBody flush>
					<Table
						keyField='id'
						data={subjects}
						emptyIcon={<IconBooks size={40} />}
						emptyText='Fanlar mavjud emas'
						columns={[
							{
								key: 'icon',
								header: '',
								width: 60,
								render: (s) => (
									<div style={{ display: 'flex', justifyContent: 'center' }}>
										<SubjectIcon icon={s.icon} size={32} />
									</div>
								),
							},
							{
								key: 'name', header: 'Nomi', render: (s) => (
									<div>
										<span className='td-main'>{s.name}</span>
										{s.is_mandatory && (
											<Badge variant='purple' style={{ marginLeft: 6, fontSize: 10 }}>
												<IconStarFilled size={10} /> Majburiy · {s.mandatory_question_count} ta
											</Badge>
										)}
									</div>
								),
							},
							{
								key: 'desc',
								header: 'Tavsif',
								render: (s) => <span style={{ color: 'var(--text-500)' }}>{s.description || '—'}</span>,
							},
							{
								key: 'stats',
								header: 'Bazasi',
								render: (s) => <><Badge variant='purple'>{s.topic_count} mavzu</Badge>{' '}<Badge variant='info'>{s.question_count} savol</Badge></>,
							},
							{
								key: 'price',
								header: 'Narxi',
								render: (s) => <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{s.price_per_question.toLocaleString()} so'm</span>,
							},
							{
								key: 'status',
								header: 'Holat',
								render: (s) => (
									<Badge variant={s.is_active ? 'success' : 'danger'}>
										{s.is_active ? 'Faol' : "O'chiq"}
									</Badge>
								),
							},
							{
								key: 'actions',
								header: '',
								width: 80,
								render: (s) => (
									<DropdownMenu
										trigger={
											<Button variant='ghost' size='icon-sm'>
												•••
											</Button>
										}
										items={[
											{
												label: 'Tahrirlash',
												icon: <IconEdit size={15} />,
												onClick: () => openEdit(s),
											},
											{
												label: s.is_mandatory ? 'Majburiydan chiqarish' : 'Majburiy qilish',
												icon: <IconStarFilled size={15} />,
												onClick: () => toggleMandatory(s),
											},
											{
												label: s.is_active ? "O'chirish" : 'Yoqish',
												icon: s.is_active ? <IconBan size={15} /> : <IconCheck size={15} />,
												onClick: () => toggleActive(s),
												variant: s.is_active ? ('danger' as const) : ('default' as const),
											},
										]}
									/>
								),
							},
						]}
					/>
				</CardBody>
			</Card>

			<Dialog
				open={showModal}
				onClose={() => setShowModal(false)}
				title={editing ? 'Fanni tahrirlash' : 'Yangi fan'}
				size='md'
				footer={
					<>
						<Button variant='ghost' onClick={() => setShowModal(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' form='subject-form'>
							{editing ? 'Saqlash' : 'Yaratish'}
						</Button>
					</>
				}
			>
				<form id='subject-form' onSubmit={handleSubmit}>
					<div className='grid-2'>
						<Input
							label='Fan nomi'
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder='Matematika'
							required
						/>
						<Input
							label="1 ta test narxi (so'm)"
							type='number'
							value={form.price_per_question}
							onChange={(e) => setForm({ ...form, price_per_question: +e.target.value })}
							required
						/>
					</div>
					<Textarea
						label='Tavsif'
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
						placeholder='Fan haqida qisqacha...'
					/>
					<IconPicker
						label='Fan ikonkasi'
						value={form.icon}
						onChange={(icon) => setForm({ ...form, icon })}
					/>

					<div style={{ marginTop: 14, padding: 14, background: 'var(--bg-900)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
							<input
								type='checkbox'
								checked={form.is_mandatory}
								onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
								style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
							/>
							<div>
								<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-100)' }}>Majburiy fan</div>
								<div style={{ fontSize: 12, color: 'var(--text-500)' }}>DTM majburiy fanlar blokiga kiradi</div>
							</div>
						</label>
						{form.is_mandatory && (
							<div style={{ marginTop: 10 }}>
								<Input
									label='Savol soni (majburiy blokda)'
									type='number'
									value={form.mandatory_question_count}
									onChange={(e) => setForm({ ...form, mandatory_question_count: +e.target.value })}
									min={1}
									max={30}
								/>
							</div>
						)}
					</div>
				</form>
			</Dialog>
		</div>
	);
}
