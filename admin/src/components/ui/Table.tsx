import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  width?: number | string
  render: (item: T, index: number) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  emptyIcon?: ReactNode
  emptyText?: string
}

export default function Table<T>({ columns, data, keyField, emptyIcon, emptyText = 'Ma\'lumot topilmadi' }: TableProps<T>) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="ui-empty">
                  {emptyIcon && <div className="ui-empty-icon">{emptyIcon}</div>}
                  <p>{emptyText}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={String(item[keyField])}>
                {columns.map(col => (
                  <td key={col.key}>{col.render(item, index)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
