import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Shell } from './Shell'
import { HomePage } from '@/pages/HomePage'
import { PlanningPage } from '@/pages/PlanningPage'
import { ResultDetailPage } from '@/pages/ResultDetailPage'
import { ObjectiveDetailPage } from '@/pages/ObjectiveDetailPage'
import { TrackingPage } from '@/pages/TrackingPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'planning', element: <PlanningPage /> },
      { path: 'planning/results/:resultId', element: <ResultDetailPage /> },
      { path: 'planning/objectives/:objectiveId', element: <ObjectiveDetailPage /> },
      { path: 'tracking', element: <TrackingPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
