import ReactSelect, { type Props as ReactSelectProps, type StylesConfig, type GroupBase } from 'react-select'

export interface SelectOption {
  value: string | number
  label: string
  icon?: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value?: string | number
  onChange?: (value: string | number) => void
  placeholder?: string
  isSearchable?: boolean
  isClearable?: boolean
  isDisabled?: boolean
  isMulti?: false
  className?: string
  menuPlacement?: 'auto' | 'top' | 'bottom'
  noOptionsMessage?: string
}

const styles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    background: 'var(--bg-900)',
    borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
    borderRadius: 'var(--radius-md)',
    minHeight: 38,
    fontSize: 14,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
    cursor: 'pointer',
    '&:hover': { borderColor: 'var(--border-hover)' },
  }),
  menu: (base) => ({
    ...base,
    background: 'var(--bg-800)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 50,
    animation: 'uiSlideUp 0.12s ease-out',
  }),
  menuList: (base) => ({
    ...base,
    padding: 4,
    maxHeight: 220,
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected
      ? 'var(--primary-50)'
      : state.isFocused
        ? 'rgba(255,255,255,0.04)'
        : 'transparent',
    color: state.isSelected ? 'var(--primary-light)' : 'var(--text-200)',
    fontSize: 13,
    fontWeight: state.isSelected ? 600 : 500,
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    '&:active': { background: 'var(--primary-50)' },
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--text-100)',
    fontSize: 14,
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--text-600)',
    fontSize: 14,
  }),
  input: (base) => ({
    ...base,
    color: 'var(--text-100)',
    fontSize: 14,
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: 'var(--text-500)',
    padding: '0 8px',
    transition: 'transform 0.2s',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : undefined,
    '&:hover': { color: 'var(--text-300)' },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--text-500)',
    padding: '0 4px',
    '&:hover': { color: 'var(--danger)' },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: 'var(--text-500)',
    fontSize: 13,
  }),
  multiValue: (base) => ({
    ...base,
    background: 'var(--primary-50)',
    borderRadius: 6,
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--primary-light)',
    fontSize: 12,
    fontWeight: 600,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--primary-light)',
    '&:hover': { background: 'var(--primary-100)', color: 'var(--danger)' },
  }),
}

export default function Select({
  label, options, value, onChange, placeholder = 'Tanlang...', isSearchable = true,
  isClearable = false, isDisabled, className, menuPlacement = 'auto', noOptionsMessage,
}: SelectProps) {
  const selectedOption = options.find(o => String(o.value) === String(value)) || null

  return (
    <div className={`ui-field ${className || ''}`}>
      {label && <label className="ui-label">{label}</label>}
      <ReactSelect<SelectOption, false>
        options={options}
        value={selectedOption}
        onChange={opt => onChange?.(opt?.value ?? '')}
        placeholder={placeholder}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isDisabled={isDisabled}
        styles={styles}
        menuPlacement={menuPlacement}
        noOptionsMessage={() => noOptionsMessage || 'Topilmadi'}
        classNamePrefix="rs"
      />
    </div>
  )
}
