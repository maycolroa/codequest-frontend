import type { LearningPath, UserProgress } from '@/types'
const mockPath: LearningPath = { id: 'full-stack', title: 'Full Stack JavaScript', description: 'Construye aplicaciones web completas desde cero hasta producción.', totalCourses: 5, courses: [{ id: 'javascript', title: 'Fundamentos de JavaScript', description: 'Bases del lenguaje.', pathId: 'full-stack', order: 1, durationMinutes: 720, level: 'beginner', completed: true }, { id: 'html-css', title: 'HTML & CSS moderno', description: 'Interfaces web.', pathId: 'full-stack', order: 2, durationMinutes: 960, level: 'beginner', completed: true }, { id: 'react', title: 'React desde cero', description: 'Componentes y estado.', pathId: 'full-stack', order: 3, durationMinutes: 1440, level: 'intermediate', completed: false }, { id: 'node', title: 'APIs con Node.js', description: 'Backend JavaScript.', pathId: 'full-stack', order: 4, durationMinutes: 1200, level: 'intermediate', completed: false }, { id: 'architecture', title: 'Arquitectura Full Stack', description: 'Producción y escala.', pathId: 'full-stack', order: 5, durationMinutes: 1920, level: 'advanced', completed: false }] }
const isMock = import.meta.env.VITE_MOCK_MODE === 'true'
export const pathsService = {
  // The current backend does not expose paths endpoints yet. Keep real mode
  // honest by showing the empty state instead of generating 404 requests.
  getAll: async (): Promise<LearningPath[]> => isMock ? [mockPath] : [],
  getById: async (id: string): Promise<LearningPath | null> => isMock ? { ...mockPath, id } : null,
  toggleProgress: async (pathId: string, courseId: string, completed: boolean): Promise<UserProgress | null> => isMock
    ? ({ userId: 'demo', pathId, completedCourseIds: completed ? [courseId] : [], completionPercentage: completed ? 100 : 0, lastActivityAt: new Date().toISOString() })
    : null,
  delete: async (id: string): Promise<void> => { void id },
}
