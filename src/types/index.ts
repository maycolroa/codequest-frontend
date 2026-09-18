export interface User { id: string; name: string; email: string; avatarUrl?: string; role: 'student' | 'admin'; createdAt: string }
export interface Course { id: string; title: string; description: string; pathId: string; order: number; durationMinutes: number; level: 'beginner' | 'intermediate' | 'advanced'; completed?: boolean }
export interface LearningPath { id: string; title: string; description: string; courses: Course[]; totalCourses: number; iconUrl?: string }
export interface UserProgress { userId: string; pathId: string; completedCourseIds: string[]; completionPercentage: number; lastActivityAt: string }
export interface AssessmentPayload { interests: string[]; level: string; goals: string[]; technologies: string[] }
export interface Assessment { id: string; pathId: string; questions: string[] }
