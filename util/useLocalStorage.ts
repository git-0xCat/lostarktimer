import { useEffect, useState, useCallback } from 'react'

type Initial<T> = T | (() => T)

const resolveInitial = <T>(init: Initial<T>): T =>
  typeof init === 'function' ? (init as () => T)() : init

export function useLocalStorage<T>(
  key: string,
  initialValue: Initial<T>
): [T | undefined, (value: T | undefined) => void] {
  const [value, setValueState] = useState<T | undefined>(undefined)

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
    },
    [key]
  )

  return [value, setValue]
}

export default useLocalStorage
