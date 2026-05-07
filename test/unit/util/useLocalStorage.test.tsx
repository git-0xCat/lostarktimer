import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import useLocalStorage from '../../../util/useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('hydrates from localStorage when a value is present', async () => {
    window.localStorage.setItem('hydrate-key', JSON.stringify('stored'))
    const { result } = renderHook(() =>
      useLocalStorage<string>('hydrate-key', 'fallback')
    )
    await waitFor(() => expect(result.current[0]).toBe('stored'))
  })

  it('returns the initial value when localStorage is empty', async () => {
    const { result } = renderHook(() =>
      useLocalStorage<string>('empty-key', 'initial')
    )
    await waitFor(() => expect(result.current[0]).toBe('initial'))
  })

  it('resolves an initialValue function only once', async () => {
    const init = vi.fn(() => 'lazy')
    const { result } = renderHook(() =>
      useLocalStorage<string>('lazy-key', init)
    )
    await waitFor(() => expect(result.current[0]).toBe('lazy'))
    expect(init).toHaveBeenCalledTimes(1)
  })

  it('persists to localStorage when set', async () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>('persist-key', 0)
    )
    await waitFor(() => expect(result.current[0]).toBe(0))
    act(() => result.current[1](42))
    expect(window.localStorage.getItem('persist-key')).toBe('42')
  })

  it('removes the key when set to undefined', async () => {
    window.localStorage.setItem('remove-key', JSON.stringify('present'))
    const { result } = renderHook(() =>
      useLocalStorage<string>('remove-key', 'initial')
    )
    await waitFor(() => expect(result.current[0]).toBe('present'))
    act(() => result.current[1](undefined))
    expect(window.localStorage.getItem('remove-key')).toBeNull()
  })

  it('broadcasts changes to other consumers on the same key', async () => {
    const { result: a } = renderHook(() =>
      useLocalStorage<boolean>('shared-key', false)
    )
    const { result: b } = renderHook(() =>
      useLocalStorage<boolean>('shared-key', false)
    )
    await waitFor(() => {
      expect(a.current[0]).toBe(false)
      expect(b.current[0]).toBe(false)
    })
    // Update via a; b should see the new value without remounting.
    act(() => a.current[1](true))
    await waitFor(() => expect(b.current[0]).toBe(true))
  })

  it('ignores broadcasts on unrelated keys', async () => {
    const { result } = renderHook(() =>
      useLocalStorage<string>('mine', 'a')
    )
    await waitFor(() => expect(result.current[0]).toBe('a'))
    act(() =>
      window.dispatchEvent(
        new CustomEvent('lostark:localStorage', {
          detail: { key: 'theirs', value: 'b' },
        })
      )
    )
    expect(result.current[0]).toBe('a')
  })

  it('falls back to the initial value when stored JSON is corrupt', async () => {
    window.localStorage.setItem('corrupt-key', '{not json')
    const { result } = renderHook(() =>
      useLocalStorage<string>('corrupt-key', 'safe')
    )
    await waitFor(() => expect(result.current[0]).toBe('safe'))
  })

  it('reflects native storage events from other tabs', async () => {
    const { result } = renderHook(() =>
      useLocalStorage<string>('cross-tab', 'a')
    )
    await waitFor(() => expect(result.current[0]).toBe('a'))
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'cross-tab',
          newValue: JSON.stringify('from-other-tab'),
        })
      )
    )
    expect(result.current[0]).toBe('from-other-tab')
  })
})
