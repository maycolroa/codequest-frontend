import api from './api'
import type { Assessment, AssessmentPayload, LearningPath } from '@/types'

const mockAssessment: Assessment = { id: 'initial', pathId: 'full-stack', questions: ['interests', 'level', 'goals', 'technologies'] }
export const ASSESSMENT_STORAGE_KEY = 'codequest:assessment'

const mockPath: LearningPath = { id: 'full-stack', title: 'Full Stack JavaScript', description: 'Ruta generada desde tu evaluación.', totalCourses: 5, courses: [] }

export const assessmentsService = {
  getById: async (id: string): Promise<Assessment> => import.meta.env.VITE_MOCK_MODE === 'true'
    ? { ...mockAssessment, id }
    : (await api.get<Assessment>(`/assessments/${id}`)).data,
  submit: async (profileId: string, payload: AssessmentPayload): Promise<LearningPath> => {
    window.localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(payload))
    if (import.meta.env.VITE_MOCK_MODE === 'true') return mockPath
    const { data } = await api.post<{ learningPaths: LearningPath[] }>(`/learning-paths/users/${profileId}/generate`, {
      interests: payload.interests,
      goals: payload.goals.join(', '),
      currentLevel: payload.level,
      availableHoursPerWeek: 6,
      preferredTechnologies: payload.technologies,
    })
    return data.learningPaths[0]
  },
}
