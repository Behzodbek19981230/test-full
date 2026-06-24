import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IconUsers, IconPlus, IconEdit, IconTrash, IconKey } from '@tabler/icons-react';
import api from '../api';
import {
	PageHeader,
	Button,
	Dialog,
	Input,
	Badge,
	Card,
	CardBody,
	ConfirmDialog,
	PageLoader,
} from '../components/ui';
import Table from '../components/ui/Table';
import Select from '../components/ui/Select';

interface AdminUser {
	id: number;
	username: string;
	full_name: string;
	role: string;
	created_at: string;
}

const ROLE_OPTIONS = [
	{ value: 'admin', label: 'Admin' },
	{ value: 'teacher', label: "O'qituvchi" },
];

const ROLE_BADGE: Record<string, { variant: 'purple' | 'info' | 'success'; label: string }> = {
	superadmin: { variant: 'purple', label: 'Superadmin' },
	admin: { variant: 'info', label: 'Admin' },
	teacher: { variant: 'success', label: "O'qituvchi" },
};

export default function AdminUsers() {
	const [admins, setAdmins] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState<AdminUser | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [form, setForm] = useState({ login: '', password: '', full_name: '', role: 'teacher' });

	const load = () => {
		api.get('/admins')
			.then((r) => setAdmins(r.data))
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		load();
	}, []);

	const openCreate = () => {
		setEditing(null);
		setForm({ login: '', password: '', full_name: '', role: 'teacher' });
		setShowModal(true);
	};

	const openEdit = (a: AdminUser) => {
		setEditing(a);
		setForm({ login: a.username, password: '', full_name: a.full_name, role: a.role });
		setShowModal(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editing) {
				const body: Record<string, string> = { full_name: form.full_name, role: form.role };
				if (form.password) body.password = form.password;
				await api.put(`/admins/${editing.id}`, body);
				toast.success('Foydalanuvchi yangilandi');
			} else {
				if (!form.password) {
					toast.error('Parolni kiriting');
					return;
				}
				await api.post('/admins', form);
				toast.success('Foydalanuvchi yaratildi');
			}
			setShowModal(false);
			load();
		} catch (err: any) {
			toast.error(err.response?.data?.detail || 'Xatolik yuz berdi');
		}
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		try {
			await api.delete(`/admins/${deleteId}`);
			toast.success("Foydalanuvchi o'chirildi");
			setDeleteId(null);
			load();
		} catch (err: any) {
			toast.error(err.response?.data?.detail || 'Xatolik');
		}
	};

	if (loading) return <PageLoader rows={5} />;

	return (
		<div>
			<PageHeader
				icon={<IconUsers size={22} />}
				iconColor='var(--primary)'
				iconBg='var(--primary-50)'
				title='Admin foydalanuvchilar'
				badge={<Badge variant='info'>{admins.length}</Badge>}
				actions={
					<Button onClick={openCreate}>
						<IconPlus size={18} /> Yangi foydalanuvchi
					</Button>
				}
			/>

			<Card>
				<CardBody flush>
					<Table
						keyField='id'
						data={admins}
						emptyIcon={<IconUsers size={40} />}
						emptyText="Foydalanuvchilar topilmadi"
						columns={[
							{
								key: 'name',
								header: 'F.I.Sh',
								render: (a) => <span className='td-main'>{a.full_name}</span>,
							},
							{
								key: 'username',
								header: 'Login',
								render: (a) => (
									<span className='td-mono' style={{ color: 'var(--text-500)' }}>
										{a.username}
									</span>
								),
							},
							{
								key: 'role',
								header: 'Role',
								render: (a) => {
									const cfg = ROLE_BADGE[a.role] || ROLE_BADGE.teacher;
									return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
								},
							},
							{
								key: 'date',
								header: 'Yaratilgan',
								render: (a) => (
									<span style={{ fontSize: 13, color: 'var(--text-500)' }}>
										{a.created_at ? new Date(a.created_at).toLocaleDateString('uz-UZ') : '—'}
									</span>
								),
							},
							{
								key: 'actions',
								header: '',
								width: 100,
								render: (a) =>
									a.role === 'superadmin' ? null : (
										<div style={{ display: 'flex', gap: 4 }}>
											<Button variant='ghost' size='icon-sm' onClick={() => openEdit(a)}>
												<IconEdit size={15} />
											</Button>
											<Button
												variant='ghost'
												size='icon-sm'
												onClick={() => setDeleteId(a.id)}
												style={{ color: 'var(--danger)' }}
											>
												<IconTrash size={15} />
											</Button>
										</div>
									),
							},
						]}
					/>
				</CardBody>
			</Card>

			<Dialog
				open={showModal}
				onClose={() => setShowModal(false)}
				title={editing ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
				footer={
					<>
						<Button variant='ghost' onClick={() => setShowModal(false)}>
							Bekor qilish
						</Button>
						<Button type='submit' form='admin-user-form'>
							{editing ? 'Saqlash' : 'Yaratish'}
						</Button>
					</>
				}
			>
				<form id='admin-user-form' onSubmit={handleSubmit}>
					<div className='grid-2'>
						<Input
							label='F.I.Sh'
							value={form.full_name}
							onChange={(e) => setForm({ ...form, full_name: e.target.value })}
							placeholder='Ism Familiya'
							required
						/>
						<Select
							label='Role'
							value={form.role}
							onChange={(val) => setForm({ ...form, role: String(val) })}
							options={ROLE_OPTIONS}
						/>
					</div>
					<Input
						label='Login'
						value={form.login}
						onChange={(e) => setForm({ ...form, login: e.target.value })}
						placeholder='login'
						required
						disabled={!!editing}
					/>
					<Input
						label={editing ? 'Yangi parol (bo\'sh qoldirsa o\'zgarmaydi)' : 'Parol'}
						type='password'
						icon={IconKey}
						value={form.password}
						onChange={(e) => setForm({ ...form, password: e.target.value })}
						placeholder='••••••••'
						required={!editing}
					/>
				</form>
			</Dialog>

			<ConfirmDialog
				open={deleteId !== null}
				onClose={() => setDeleteId(null)}
				onConfirm={handleDelete}
				message="Bu foydalanuvchini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."
			/>
		</div>
	);
}
