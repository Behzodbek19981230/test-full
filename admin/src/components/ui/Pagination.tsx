import Button from './Button'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="ui-pagination">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <IconChevronLeft size={16} /> Oldingi
      </Button>
      <span className="ui-pagination-info">
        {page} / {totalPages}
      </span>
      <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Keyingi <IconChevronRight size={16} />
      </Button>
    </div>
  )
}
