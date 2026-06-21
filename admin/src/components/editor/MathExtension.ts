import { Node, mergeAttributes } from '@tiptap/core'
import katex from 'katex'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      insertMath: (latex: string) => ReturnType
    }
  }
}

export const MathNode = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-math]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const latex = HTMLAttributes.latex || ''
    let rendered: string
    try {
      rendered = katex.renderToString(latex, { throwOnError: false, displayMode: false })
    } catch {
      rendered = latex
    }
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-math': '',
      'data-latex': latex,
      class: 'math-node',
      contenteditable: 'false',
    }), ['span', { innerHTML: rendered }]]
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement('span')
      dom.classList.add('math-node')
      dom.contentEditable = 'false'
      dom.setAttribute('data-math', '')
      dom.setAttribute('data-latex', node.attrs.latex)
      Object.entries(HTMLAttributes).forEach(([key, val]) => {
        if (typeof val === 'string') dom.setAttribute(key, val)
      })
      try {
        katex.render(node.attrs.latex, dom, { throwOnError: false, displayMode: false })
      } catch {
        dom.textContent = node.attrs.latex
      }
      return { dom }
    }
  },

  addCommands() {
    return {
      insertMath: (latex: string) => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: { latex } })
      },
    }
  },
})

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-math-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const latex = HTMLAttributes.latex || ''
    let rendered: string
    try {
      rendered = katex.renderToString(latex, { throwOnError: false, displayMode: true })
    } catch {
      rendered = latex
    }
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-math-block': '',
      'data-latex': latex,
      class: 'math-block-node',
      contenteditable: 'false',
    }), ['div', { innerHTML: rendered }]]
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div')
      dom.classList.add('math-block-node')
      dom.contentEditable = 'false'
      dom.setAttribute('data-math-block', '')
      dom.setAttribute('data-latex', node.attrs.latex)
      try {
        katex.render(node.attrs.latex, dom, { throwOnError: false, displayMode: true })
      } catch {
        dom.textContent = node.attrs.latex
      }
      return { dom }
    }
  },
})
