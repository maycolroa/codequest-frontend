import api from './api'
import type { Assessment, AssessmentPayload, LearningPath } from '@/types'
const mockAssessment: Assessment = { id: 'initial', pathId: 'full-stack', questions: ['interests', 'level', 'goals', 'technologies'] }
const mockPath: LearningPath = { id: 'full-stack', title: 'Full Stack JavaScript', description: 'Ruta generada desde tu evaluación.', totalCourses: 5, courses: [], }
export const assessmentsService = { getById: async (id: string): Promise<Assessment> => import.meta.env.VITE_MOCK_MODE === 'true' ? { ...mockAssessment, id } : (await api.get<Assessment>(`/assessments/${id}`)).data, submit: async (id: string, payload: AssessmentPayload): Promise<LearningPath> => import.meta.env.VITE_MOCK_MODE === 'true' ? mockPath : (await api.post<LearningPath>(`/assessments/${id}/submit`, payload)).data }
