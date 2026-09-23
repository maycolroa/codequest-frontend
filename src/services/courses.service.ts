import api from './api'
import type { Course, CourseGalaxyResponse } from '@/types'
export const coursesService = { getAll: async (): Promise<Course[]> => (await api.get<Course[]>('/courses')).data, getById: async (id: string): Promise<Course> => (await api.get<Course>(`/courses/${id}`)).data, getCategories: async (): Promise<string[]> => (await api.get<string[]>('/courses/categories')).data, getCourseGalaxy: async (): Promise<CourseGalaxyResponse> => (await api.get<CourseGalaxyResponse>('/courses/galaxy')).data }
