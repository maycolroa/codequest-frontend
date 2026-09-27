import api from './api'
import type { LearningPath, UserProgress } from '@/types'

const mockPath: LearningPath = { id: 'full-stack', title: 'Full Stack JavaScript', description: 'Construye aplicaciones web completas desde cero hasta producción.', totalCourses: 5, courses: [] }
const isMock = import.meta.env.VITE_MOCK_MODE === 'true'
interface BackendLearningPath { id: string; title: string; description: string; coursesOrder?: { courseId: string; order: number; reason: string }[] }
const toLearningPath = (path: BackendLearningPath): LearningPath => ({ id: path.id, title: path.title, description: path.description, totalCourses: path.coursesOrder?.length ?? 0, courses: [] })
export const pathsService = {
  getAll: async (profileId: string): Promise<LearningPath[]> => {
    if (isMock) return [mockPath]
    const { data } = await api.get<BackendLearningPath[]>(`/learning-paths/users/${profileId}`)
    return data.map(toLearningPath)
  },
  getById: async (profileId: string, id: string): Promise<LearningPath | null> => {
    if (isMock) return { ...mockPath, id }
    const { data } = await api.get<LearningPath>(`/learning-paths/users/${profileId}/${id}`)
    return { ...data, totalCourses: data.courses?.length ?? data.totalCourses ?? 0 }
  },
  toggleProgress: async (pathId: string, courseId: string, completed: boolean): Promise<UserProgress | null> => isMock ? ({ userId: 'demo', pathId, completedCourseIds: completed ? [courseId] : [], completionPercentage: completed ? 100 : 0, lastActivityAt: new Date().toISOString() }) : null,
  delete: async (profileId: string, id: string): Promise<void> => { if (!isMock) await api.delete(`/learning-paths/users/${profileId}/${id}`) },
}
