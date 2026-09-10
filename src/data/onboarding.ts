export const ONBOARDING_KEY = 'aleph.onboarding.v1'

export function isOnboardingDone(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(ONBOARDING_KEY) === 'done'
}

export function markOnboardingDone(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(ONBOARDING_KEY, 'done')
}

export function resetOnboarding(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(ONBOARDING_KEY)
}
