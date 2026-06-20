interface Props {
  icon: string
  size?: number
}

export default function SubjectIcon({ icon, size = 26 }: Props) {
  if (!icon) return <span style={{ fontSize: size }}>📚</span>

  if (icon.startsWith('<svg') || icon.startsWith('<?xml')) {
    const cleaned = icon.replace(/<\?xml[^?]*\?>\s*/g, '')
    const sized = cleaned.replace(/width="[^"]*"/g, `width="${size}"`).replace(/height="[^"]*"/g, `height="${size}"`)
    const final = /width=/.test(sized) ? sized : sized.replace('<svg', `<svg width="${size}" height="${size}"`)
    return <span className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: final }} />
  }

  if (icon.startsWith('/api/') || icon.startsWith('http') || icon.startsWith('data:')) {
    return <img src={icon} alt="" className="shrink-0 object-contain" style={{ width: size, height: size }} />
  }

  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>
}
