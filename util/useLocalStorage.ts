import { useEffect, useState, useCallback } from 'react'

type Initial<T> = T | (() => T)

const STORAGE_EVENT = 'lostark:localStorage'

const resolveInitial = <T>(init: Initial<T>): T =>
  typeof init === 'function' ? (init as () => T)() : init

const broadcast = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, { detail: { key, value } })
  )
}

export function useLocalStorage<T>(
  key: string,
  initialValue: Initial<T>
): [T | undefined, (value: T | undefined) => void] {
  const [value, setValueState] = useState<T | undefined>(undefined)

  // Hydrate from storage on mount, and again on key change.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) {
        setValueState(JSON.parse(stored) as T)
      } else {
        setValueState(resolveInitial(initialValue))
      }
    } catch {
      setValueState(resolveInitial(initialValue))
    }
  }, [key])

  // Listen for changes to this key from other consumers (modals, other
  // tabs). Same-tab listeners use the custom event; cross-tab listeners
  // use the native storage event.
  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.key === key) setValueState(detail.value as T | undefined)
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        setValueState(
          e.newValue === null ? undefined : (JSON.parse(e.newValue) as T)
        )
      } catch {
        // ignore
      }
    }
    window.addEventListener(STORAGE_EVENT, onCustom)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(STORAGE_EVENT, onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [key])

  const setValue = useCallback(
    (newValue: T | undefined) => {
      setValueState(newValue)
      try {
        if (newValue === undefined) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, JSON.stringify(newValue))
        }
      } catch {
        // swallow quota / private mode errors
      }
      broadcast(key, newValue)
    },
    [key]
  )

  return [value, setValue]
}

export default useLocalStorage
