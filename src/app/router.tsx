import { createBrowserRouter, Navigate } from 'react-router-dom'
import { OnboardingGate } from './OnboardingGate'
import { Shell } from './Shell'
import { HomePage } from '@/pages/HomePage'
import { PlanningPage } from '@/pages/PlanningPage'
import { WeekPlanningPage } from '@/pages/WeekPlanningPage'
import { ResultDetailPage } from '@/pages/ResultDetailPage'
import { ObjectiveDetailPage } from '@/pages/ObjectiveDetailPage'
import { TrackingPage } from '@/pages/TrackingPage'
import { OnboardingLayout } from '@/pages/onboarding/OnboardingLayout'
import { OnboardingCharacterPage } from '@/pages/onboarding/OnboardingCharacterPage'
import { OnboardingResultPage } from '@/pages/onboarding/OnboardingResultPage'
import { OnboardingBlockPage } from '@/pages/onboarding/OnboardingBlockPage'

export const router = createBrowserRouter([
  {
    element: <OnboardingGate />,
    children: [
      {
        path: '/onboarding',
        element: <OnboardingLayout />,
        children: [
          { index: true, element: <OnboardingCharacterPage /> },
          { path: 'result', element: <OnboardingResultPage /> },
          { path: 'block', element: <OnboardingBlockPage /> },
        ],
      },
      {
        path: '/',
        element: <Shell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'planning', element: <PlanningPage /> },
          { path: 'planning/week', element: <WeekPlanningPage /> },
          { path: 'planning/results/:resultId', element: <ResultDetailPage /> },
          { path: 'planning/objectives/:objectiveId', element: <ObjectiveDetailPage /> },
          { path: 'tracking', element: <TrackingPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
