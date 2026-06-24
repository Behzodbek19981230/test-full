import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
	IconFileText, IconUpload, IconTrash, IconEye, IconArrowLeft, IconExternalLink,
	IconFile, IconFileTypePdf, IconPhoto, IconFileSpreadsheet,
} from '@tabler/icons-react';
import api from '../api';
import { PageHeader, Button, Dialog, Input, Textarea, Card, CardBody, EmptyState, ConfirmDialog, PageLoader } from '../components/ui';

interface Material {
	id: number;
	subject_id: number;
	title: string;
	description: string | null;
	file_path: string;
	file_name: string;
	file_size: number;
	file_type: string;
	created_at: string;
}

interface Subject {
	id: number;
	name: string;
	icon: string;
}

const FILE_ICONS: Record<string, typeof IconFile> = {
	pdf: IconFileTypePdf,
	png: IconPhoto,
	jpg: IconPhoto,
	jpeg: IconPhoto,
};

function formatSize(bytes: number) {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export default function Materials() {
	const { subjectId } = useParams();
	const navigate = useNavigate();
	const [materials, setMaterials] = useState<Material[]>([]);
	const [loading, setLoading] = useState(true);
	const [subject, setSubject] = useState<Subject | null>(null);
	const [showUpload, setShowUpload] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [preview, setPreview] = useState<Material | null>(null);

	const load = () => {
		api.get(`/materials/${subjectId}`).then((r) => setMaterials(r.data));
	};

	useEffect(() => {
		Promise.all([
			api.get(`/subjects/${subjectId}`).then((r) => setSubject(r.data)),
			load(),
		]).finally(() => setLoading(false));
	}, [subjectId]);

	const handleUpload = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			toast.error('Faylni tanlang');
			return;
		}
		setUploading(true);
		setUploadProgress(0);
		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('description', description);
			formData.append('file', file);
			await api.post(`/materials/${subjectId}`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
				onUploadProgress: (e) => {
					if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
				},
			});
			toast.success('Material yuklandi');
			setShowUpload(false);
			setTitle('');
			setDescription('');
			setFile(null);
			load();
		} catch (err: any) {
			const msg = err.response?.data?.detail || 'Yuklashda xatolik';
			toast.error(msg);
		} finally {
			setUploading(false);
			setUploadProgress(0);
		}
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		try {
			await api.delete(`/materials/${subjectId}/${deleteId}`);
			toast.success("Material o'chirildi");
			setDeleteId(null);
			load();
		} catch {
			toast.error('Xatolik');
		}
	};

	const openFile = (m: Material) => {
		window.open(`${API_BASE}/uploads/${m.file_path}`, '_blank');
	};

	if (loading) return <PageLoader rows={5} />;

	return (
		<div>
			<PageHeader
				icon={<IconFileText size={22} />}
				iconColor='var(--info)'
				iconBg='var(--info-50)'
				title={`Materiallar — ${subject?.name || ''}`}
				actions={
					<>
						<Button variant='ghost' size='sm' onClick={() => navigate('/subjects')}>
							<IconArrowLeft size={16} /> Ortga
						</Button>
						<Button onClick={() => setShowUpload(true)}>
							<IconUpload size={18} /> Yuklash
						</Button>
					</>
				}
			/>

			<Card>
				<CardBody flush>
					{materials.length === 0 ? (
						<EmptyState icon={<IconFileText size={40} />} text="Hali materiallar yuklanmagan" />
					) : (
						<div style={{ display: 'flex', flexDirection: 'column' }}>
							{materials.map((m) => {
								const FileIcon = FILE_ICONS[m.file_type] || IconFile;
								return (
									<div
										key={m.id}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 14,
											padding: '14px 20px',
											borderBottom: '1px solid var(--border)',
											transition: 'background 0.15s',
											cursor: 'pointer',
										}}
										className='ui-notif'
										onClick={() => setPreview(m)}
									>
										<div
											style={{
												width: 44,
												height: 44,
												borderRadius: 10,
												background: 'var(--info-50)',
												color: 'var(--info)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											<FileIcon size={22} />
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-100)' }}>
												{m.title}
											</div>
											<div style={{ fontSize: 12, color: 'var(--text-500)', marginTop: 2 }}>
												{m.file_name} · {formatSize(m.file_size)} ·{' '}
												{new Date(m.created_at).toLocaleDateString('uz-UZ')}
											</div>
											{m.description && (
												<div style={{ fontSize: 12, color: 'var(--text-400)', marginTop: 2 }}>
													{m.description}
												</div>
											)}
										</div>
										<div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
											<Button
												variant='ghost'
												size='icon-sm'
												onClick={(e) => {
													e.stopPropagation();
													setPreview(m);
												}}
											>
												<IconEye size={16} />
											</Button>
											<Button
												variant='ghost'
												size='icon-sm'
												onClick={(e) => {
													e.stopPropagation();
													setDeleteId(m.id);
												}}
											>
												<IconTrash size={16} style={{ color: 'var(--danger)' }} />
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardBody>
			</Card>

			{/* Upload dialog */}
			<Dialog
				open={showUpload}
				onClose={() => setShowUpload(false)}
				title='Material yuklash'
				size='md'
				footer={
					uploading ? (
						<div style={{ width: '100%' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
								<span style={{ color: 'var(--text-300)' }}>Yuklanmoqda...</span>
								<span style={{ color: 'var(--primary)' }}>{uploadProgress}%</span>
							</div>
							<div style={{ height: 6, background: 'var(--bg-600)', borderRadius: 3, overflow: 'hidden' }}>
								<div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', borderRadius: 3, transition: 'width 0.3s' }} />
							</div>
						</div>
					) : (
						<>
							<Button variant='ghost' onClick={() => setShowUpload(false)}>
								Bekor qilish
							</Button>
							<Button type='submit' form='upload-form'>
								<IconUpload size={16} /> Yuklash
							</Button>
						</>
					)
				}
			>
				<form id='upload-form' onSubmit={handleUpload}>
					<Input
						label='Sarlavha'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Masalan: Matematika darsligi"
						required
					/>
					<Textarea
						label='Tavsif (ixtiyoriy)'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder='Qisqacha izoh...'
					/>
					<div className='ui-field'>
						<label className='ui-label'>Fayl</label>
						<label
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 8,
								padding: '24px 16px',
								border: '2px dashed var(--border)',
								borderRadius: 'var(--radius-lg)',
								cursor: 'pointer',
								transition: 'all 0.2s',
								background: file ? 'var(--info-50)' : 'rgba(0,0,0,0.01)',
								color: file ? 'var(--info)' : 'var(--text-400)',
							}}
						>
							<IconUpload size={24} />
							{file ? (
								<span style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</span>
							) : (
								<span style={{ fontSize: 14 }}>PDF, DOC, kitob yoki rasm tanlang</span>
							)}
							<input
								type='file'
								accept='.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg'
								style={{ display: 'none' }}
								onChange={(e) => setFile(e.target.files?.[0] || null)}
							/>
						</label>
					</div>
				</form>
			</Dialog>

			{/* Delete confirm */}
			<ConfirmDialog
				open={deleteId !== null}
				onClose={() => setDeleteId(null)}
				onConfirm={handleDelete}
				message="Bu materialni o'chirmoqchimisiz? Fayl serverdan ham o'chiriladi."
			/>

			{/* Preview */}
			{preview && (
				<div
					className='ui-dialog-overlay'
					onClick={() => setPreview(null)}
					style={{ padding: 0 }}
				>
					<div
						style={{
							width: '95%',
							maxWidth: 900,
							height: '90vh',
							background: 'var(--bg-800)',
							borderRadius: 16,
							overflow: 'hidden',
							display: 'flex',
							flexDirection: 'column',
							animation: 'uiSlideUp 0.2s',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '12px 16px',
							borderBottom: '1px solid var(--border)',
							flexShrink: 0,
						}}>
							<div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-100)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{preview.title}
							</div>
							<div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => window.open(`${API_BASE}/uploads/${preview.file_path}`, '_blank')}
								>
									<IconExternalLink size={15} /> Yangi tabda
								</Button>
								<Button variant='ghost' size='sm' onClick={() => setPreview(null)}>
									Yopish
								</Button>
							</div>
						</div>
						<div style={{ flex: 1, overflow: 'hidden' }}>
							{['png', 'jpg', 'jpeg'].includes(preview.file_type) ? (
								<div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg-700)' }}>
									<img
										src={`${API_BASE}/uploads/${preview.file_path}`}
										alt={preview.title}
										style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
									/>
								</div>
							) : (
								<iframe
									src={`${API_BASE}/uploads/${preview.file_path}`}
									style={{ width: '100%', height: '100%', border: 'none' }}
									title={preview.title}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
