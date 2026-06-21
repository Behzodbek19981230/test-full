import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: { src: string; alt?: string; width?: number }) => ReturnType
    }
  }
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: 300 },
    }
  },

  parseHTML() {
    return [{ tag: 'img[data-resizable]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { 'data-resizable': '' })]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement('div')
      wrapper.classList.add('resizable-image-wrap')

      const img = document.createElement('img')
      img.src = node.attrs.src
      if (node.attrs.alt) img.alt = node.attrs.alt
      img.style.width = `${node.attrs.width}px`
      img.classList.add('resizable-image')
      img.draggable = false

      const handle = document.createElement('div')
      handle.classList.add('resizable-image__handle')
      handle.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'

      let startX = 0
      let startWidth = 0
      let dragging = false

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        startX = e.clientX
        startWidth = img.offsetWidth
        dragging = true
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        wrapper.classList.add('resizing')
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return
        const diff = e.clientX - startX
        const newWidth = Math.max(60, Math.min(startWidth + diff, 800))
        img.style.width = `${newWidth}px`
      }

      const onMouseUp = (e: MouseEvent) => {
        if (!dragging) return
        dragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        wrapper.classList.remove('resizing')

        const diff = e.clientX - startX
        const newWidth = Math.max(60, Math.min(startWidth + diff, 800))

        if (typeof getPos === 'function') {
          const pos = getPos()
          if (pos != null) {
            editor.view.dispatch(
              editor.view.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                width: newWidth,
              })
            )
          }
        }
      }

      handle.addEventListener('mousedown', onMouseDown)

      wrapper.appendChild(img)
      wrapper.appendChild(handle)

      return {
        dom: wrapper,
        destroy() {
          handle.removeEventListener('mousedown', onMouseDown)
        },
      }
    }
  },

  addCommands() {
    return {
      setResizableImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
