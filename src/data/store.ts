import { useSyncExternalStore } from 'react'
import { loadState, saveState } from './storage'
import type { AlephState } from '@/domain/types'

type Listener = () => void

let state: AlephState = loadState()
const listeners = new Set<Listener>()

export function getState(): AlephState {
  return state
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setState(updater: (current: AlephState) => AlephState): AlephState {
  state = updater(state)
  saveState(state)
  listeners.forEach((l) => l())
  return state
}

/**
 * The whole state object. It is replaced on every write, so components can derive
 * with `useMemo` without risking an unstable snapshot.
 */
export function useAleph(): AlephState {
  return useSyncExternalStore(subscribe, getState, getState)
}

let counter = 0

export function newId(prefix: string): string {
  counter += 1
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${random}`
}
