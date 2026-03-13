import s from './Button.module.css'
const variants = { primary:s.primary, outline:s.outline, ghost:s.ghost, danger:s.danger, amber:s.amber }
const sizes    = { sm:s.sm, md:s.md, lg:s.lg }
export default function Button({ children, variant='primary', size='md', loading, disabled, fullWidth, onClick, type='button', icon, className='' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      className={[s.btn, variants[variant]||s.primary, sizes[size], fullWidth?s.fw:'', className].filter(Boolean).join(' ')}>
      {loading ? <span className={s.spinner}/> : icon ? <span>{icon}</span> : null}
      <span>{children}</span>
    </button>
  )
}
