import { Navigate, useParams } from 'react-router'
import { getChapter } from '@/content'

/** Chapters are now explored on their region's map. */
export function ChapterPage() {
  const { chapterId = '' } = useParams()
  const chapter = getChapter(chapterId)
  return <Navigate to={chapter ? `/region/${chapter.regionId}` : '/world'} replace />
}
