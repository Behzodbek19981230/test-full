import type { Metadata } from 'next'
import { extractSubjectId } from '@/lib/slug'

interface Props {
  params: Promise<{ subjectSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subjectSlug } = await params
  const subjectId = extractSubjectId(subjectSlug)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  let subjectName = 'Test'
  try {
    const subjects = await fetch(`${apiUrl}/api/subjects`, { next: { revalidate: 3600 } }).then(r => r.json())
    const subject = subjects.find((s: { id: number; name: string }) => s.id === subjectId)
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
  return (
    <>
      <link
        rel='stylesheet'
        href='https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
        crossOrigin='anonymous'
      />
      {children}
    </>
  )
}
