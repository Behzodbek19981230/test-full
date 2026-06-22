import type { Metadata } from 'next'

interface Props {
  params: Promise<{ subjectId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectId } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  let subjectName = 'Test'
  try {
    const subjects = await fetch(`${apiUrl}/api/subjects`, { next: { revalidate: 3600 } }).then(r => r.json())
    const subject = subjects.find((s: { id: number; name: string }) => String(s.id) === subjectId)
    if (subject) subjectName = subject.name
  } catch {}

  const title = `${subjectName} — Online Test`
  const description = `${subjectName} fanidan 30 ta savollik online sinov testi. DTM va attestatsiyaga tayyorlanish uchun Test Market platformasida testni ishlang.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Test Market`,
      description,
      type: 'website',
    },
  }
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children
}
