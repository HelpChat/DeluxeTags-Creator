import { useApp } from '../state/store'

export function Toasts() {
  const { toasts } = useApp()
  return (
    <ul id="messages" aria-live="polite">
      {toasts.map((item) => (
        <li key={item.id} className={item.error ? 'error' : undefined}>
          {item.message}
        </li>
      ))}
    </ul>
  )
}
