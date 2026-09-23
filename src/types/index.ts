export interface User { id: string; discordId: string | null; username: string; email: string | null; avatarUrl: string | null; isActive?: boolean; createdAt: string; updatedAt: string }
export interface Course { id: string; title: string; description: string; pathId: string; order: number; durationMinutes: number; level: 'beginner' | 'intermediate' | 'advanced'; completed?: boolean }
export interface LearningPath { id: string; title: string; description: string; courses: Course[]; totalCourses: number; iconUrl?: string }
export interface UserProgress { userId: string; pathId: string; completedCourseIds: string[]; completionPercentage: number; lastActivityAt: string }
export interface AssessmentPayload { interests: string[]; level: string; goals: string[]; technologies: string[] }
export interface Assessment { id: string; pathId: string; questions: string[] }

export type CourseLevel = Course['level']

export interface Galaxy {
  key: string
  name: string
  color: string
  center: { x: number; y: number; z: number }
}

export interface GalaxyCourse {
  id: string
  slug: string
  title: string
  category: string
  level: CourseLevel
  tags: string[]
  isActive: boolean
  galaxies: string[] // keys de Galaxy; [0] es la galaxia principal
  galaxyColor: string
  positionX?: number | null
  positionY?: number | null
  positionZ?: number | null
  prerequisites: string[] // slugs
  related: string[] // slugs
}

export interface CourseGalaxyResponse {
  galaxies: Galaxy[]
  courses: GalaxyCourse[]
}

import type { ReactElement } from 'react'

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type */
declare global {
  namespace JSX {
    interface Element extends ReactElement {
    }
  }
}
