import s from './Pill.module.css'
const V = { green:s.green, amber:s.amber, red:s.red, gray:s.gray, blue:s.blue, purple:s.purple }
export default function Pill({ children, variant='gray', dot=false }) {
  return <span className={[s.pill, V[variant]||s.gray].join(' ')}>{dot && <span className={s.dot}/>}{children}</span>
}
