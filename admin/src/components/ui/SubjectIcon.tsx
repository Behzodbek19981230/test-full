interface SubjectIconProps {
  icon: string
  size?: number
}

export default function SubjectIcon({ icon, size = 24 }: SubjectIconProps) {
  if (!icon) return <span style={{ fontSize: size }}>📚</span>

  if (icon.startsWith('<svg') || icon.startsWith('<?xml')) {
    const cleaned = icon.replace(/<\?xml[^?]*\?>\s*/g, '')
    const sized = cleaned
      .replace(/width="[^"]*"/g, `width="${size}"`)
      .replace(/height="[^"]*"/g, `height="${size}"`)
    const hasSize = /width=/.test(sized)
    const final = hasSize ? sized : sized.replace('<svg', `<svg width="${size}" height="${size}"`)

    return (
      <span
        style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: final }}
      />
    )
  }

  if (icon.startsWith('/api/') || icon.startsWith('http') || icon.startsWith('data:')) {
    return <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  }

  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>
}
