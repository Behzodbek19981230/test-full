import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconCreditCard, IconEye, IconClock, IconCircleCheck, IconCircleX, IconPhoto } from '@tabler/icons-react';
import api from '../api';
import { PageHeader, Button, Dialog, Badge, Card, CardBody, Textarea, Pagination } from '../components/ui';
import Table from '../components/ui/Table';

function formatMoney(val: string): string {
	const digits = val.replace(/\D/g, '');
	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function parseMoney(val: string): number {
	return parseInt(val.replace(/\s/g, ''), 10) || 0;
}

interface Payment {
	id: number;
	user: { full_name: string; username: string; telegram_id: number };
	subject_name: string;
	question_count: number;
	mode: string;
	amount: number;
	screenshot_file_id: string;
	status: string;
	admin_note: string;
	created_at: string;
}

export default function Payments() {
	const [payments, setPayments] = useState<Payment[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState('pending');
	const [selected, setSelected] = useState<Payment | null>(null);
	const [note, setNote] = useState('');
	const [amountDisplay, setAmountDisplay] = useState('');

	const load = () => {
		api.get(`/payments?status=${statusFilter}&page=${page}&per_page=10`).then((r) => {
			setPayments(r.data.payments);
			setTotal(r.data.total);
		});
	};

	useEffect(() => {
		load();
	}, [page, statusFilter]);

	const approve = async (id: number) => {
		const amount = parseMoney(amountDisplay);
		if (!amount) {
			toast.error("Summani kiriting");
			return;
		}
		try {
			await api.put(`/payments/${id}/approve`, { note, amount });
			toast.success("To'lov tasdiqlandi va variant yaratildi");
			setSelected(null);
			setNote('');
			setAmountDisplay('');
			load();
		} catch (e: any) {
			const msg = e.response?.data?.detail || 'Xatolik yuz berdi';
			toast.error(msg);
		}
	};

	const reject = async (id: number) => {
		if (!note.trim()) {
			toast.error('Rad etish sababini yozing');
			return;
		}
		try {
			await api.put(`/payments/${id}/reject`, { note });
			toast.success("To'lov rad etildi");
			setSelected(null);
			setNote('');
			load();
		} catch (e: any) {
			const msg = e.response?.data?.detail || 'Xatolik yuz berdi';
			toast.error(msg);
		}
	};

	const statusBadge = (s: string) => {
		if (s === 'pending')
			return (
				<Badge variant='warning'>
					<IconClock size={13} /> Kutilmoqda
				</Badge>
			);
		if (s === 'approved')
			return (
				<Badge variant='success'>
					<IconCircleCheck size={13} /> Tasdiqlangan
				</Badge>
			);
		return (
			<Badge variant='danger'>
				<IconCircleX size={13} /> Rad etilgan
			</Badge>
		);
	};

	const tabs = [
		{ key: 'pending', icon: <IconClock size={16} />, label: 'Kutilmoqda' },
		{ key: 'approved', icon: <IconCircleCheck size={16} />, label: 'Tasdiqlangan' },
		{ key: 'rejected', icon: <IconCircleX size={16} />, label: 'Rad etilgan' },
	];

	return (
		<div>
			<PageHeader
				icon={<IconCreditCard size={22} />}
				iconColor='var(--warning)'
				iconBg='var(--warning-50)'
				title="To'lovlar"
				actions={
					<>
						{tabs.map((t) => (
							<Button
								key={t.key}
								variant={statusFilter === t.key ? 'primary' : 'ghost'}
								size='sm'
								onClick={() => {
									setStatusFilter(t.key);
									setPage(1);
								}}
							>
								{t.icon} {t.label}
							</Button>
						))}
					</>
				}
			/>

			<Card>
				<CardBody flush>
					<Table
						keyField='id'
						data={payments}
						emptyIcon={<IconCreditCard size={40} />}
						emptyText="To'lovlar topilmadi"
						columns={[
							{
								key: 'user',
								header: 'Foydalanuvchi',
								render: (p) => (
									<>
										<div className='td-main'>{p.user?.full_name}</div>
										<div className='td-sub'>@{p.user?.username || "noma'lum"}</div>
									</>
								),
							},
							{
								key: 'test',
								header: 'Test',
								render: (p) =>
									`${p.subject_name} (${p.question_count} ta, ${p.mode === 'mixed' ? 'aralash' : 'mavzuli'})`,
							},
							{
								key: 'amount',
								header: 'Summa',
								render: (p) => <strong>{p.amount.toLocaleString()} so'm</strong>,
							},
							{ key: 'status', header: 'Holat', render: (p) => statusBadge(p.status) },
							{
								key: 'date',
								header: 'Sana',
								render: (p) => (
									<span style={{ fontSize: 13, color: 'var(--text-500)' }}>
										{new Date(p.created_at).toLocaleString('uz-UZ')}
									</span>
								),
							},
							{
								key: 'actions',
								header: '',
								width: 50,
								render: (p) => (
									<Button
										variant='ghost'
										size='icon-sm'
										onClick={() => {
											setSelected(p);
											setNote('');
											setAmountDisplay(formatMoney(String(p.amount > 0 ? p.amount : 5000)));
										}}
									>
										<IconEye size={16} />
									</Button>
								),
							},
						]}
					/>
				</CardBody>
				<Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
			</Card>

			<Dialog
				open={!!selected}
				onClose={() => setSelected(null)}
				title={`To'lov #${selected?.id || ''}`}
				footer={
					selected?.status === 'pending' ? (
						<>
							<Button variant='danger' onClick={() => reject(selected!.id)}>
								<IconCircleX size={16} /> Rad etish
							</Button>
							<Button variant='success' onClick={() => approve(selected!.id)}>
								<IconCircleCheck size={16} /> Tasdiqlash
							</Button>
						</>
					) : undefined
				}
			>
				{selected && (
					<>
						<div className='ui-detail-grid' style={{ marginBottom: 16 }}>
							<div className='ui-detail-item'>
								<div className='ui-detail-label'>Foydalanuvchi</div>
								<div className='ui-detail-value'>{selected.user?.full_name}</div>
								<div className='td-sub'>
									@{selected.user?.username} | TG: {selected.user?.telegram_id}
								</div>
							</div>
							<div className='ui-detail-item'>
								<div className='ui-detail-label'>Fan / Test</div>
								<div className='ui-detail-value'>{selected.subject_name}</div>
								<div className='td-sub'>
									{selected.question_count} ta ·{' '}
									{selected.mode === 'mixed' ? 'Aralash' : 'Mavzulashtirilgan'}
								</div>
							</div>
							<div className='ui-detail-item'>
								<div className='ui-detail-label'>Summa</div>
								<div className='ui-detail-value' style={{ color: 'var(--warning)' }}>
									{selected.amount.toLocaleString()} so'm
								</div>
							</div>
							<div className='ui-detail-item'>
								<div className='ui-detail-label'>Holat</div>
								<div style={{ marginTop: 4 }}>{statusBadge(selected.status)}</div>
							</div>
						</div>

						{selected.screenshot_file_id && (
							<div className='ui-detail-item' style={{ marginBottom: 16 }}>
								<div
									className='ui-detail-label'
									style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
								>
									<IconPhoto size={14} /> Screenshot
								</div>
								<img
									src={`${import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'}/uploads/${selected.screenshot_file_id}`}
									alt="To'lov cheki"
									style={{
										maxWidth: '100%',
										maxHeight: 400,
										borderRadius: 8,
										border: '1px solid var(--border)',
									}}
								/>
							</div>
						)}

						{selected.status === 'pending' && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
								<div className='ui-field'>
									<label className='ui-label'>To'lov summasi</label>
									<div className='ui-input-wrap' style={{ position: 'relative' }}>
										<input
											className='ui-input'
											inputMode='numeric'
											placeholder='0'
											value={amountDisplay}
											onChange={(e) => setAmountDisplay(formatMoney(e.target.value))}
											style={{ paddingRight: 50 }}
										/>
										<span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-400)', fontWeight: 500, pointerEvents: 'none' }}>
											so'm
										</span>
									</div>
								</div>
								<Textarea
									label='Izoh'
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder='Ixtiyoriy izoh...'
								/>
							</div>
						)}

						{selected.status !== 'pending' && selected.admin_note && (
							<div className='ui-detail-item'>
								<div className='ui-detail-label'>Admin izohi</div>
								<div style={{ fontSize: 14, color: 'var(--text-300)' }}>{selected.admin_note}</div>
							</div>
						)}
					</>
				)}
			</Dialog>
		</div>
	);
}
