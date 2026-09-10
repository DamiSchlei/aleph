import { beforeEach, describe, expect, it } from 'vitest'
import {
  ONBOARDING_KEY,
  isOnboardingDone,
  markOnboardingDone,
  resetOnboarding,
} from './onboarding'

const memory = new Map<string, string>()

beforeEach(() => {
  memory.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    },
  })
})

describe('onboarding flag', () => {
  it('shows when the key is missing and skip/finish writes done', () => {
    expect(isOnboardingDone()).toBe(false)
    markOnboardingDone()
    expect(memory.get(ONBOARDING_KEY)).toBe('done')
    expect(isOnboardingDone()).toBe(true)
  })

  it('replay clears the key', () => {
    markOnboardingDone()
    resetOnboarding()
    expect(memory.has(ONBOARDING_KEY)).toBe(false)
    expect(isOnboardingDone()).toBe(false)
  })
})
