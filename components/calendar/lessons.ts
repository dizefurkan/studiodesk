import type { ScheduleCourse, ScheduleSession } from '@/lib/actions/schedule.actions'

export const CALENDAR_VIEWS = ['day', 'week', 'rooms', 'month'] as const
export type CalendarView = (typeof CALENDAR_VIEWS)[number]

/** One lesson on a given day: a course on its weekday, with the session if attendance was taken. */
export type Lesson = { course: ScheduleCourse; date: string; session?: ScheduleSession }

export function minutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * Side-by-side placement for lessons that overlap in one column: each gets a lane and the
 * number of lanes used by its overlapping group, so blocks can share the width.
 */
export function layoutLanes(lessons: Lesson[]) {
  const sorted = [...lessons].sort((a, b) => minutes(a.course.start_time) - minutes(b.course.start_time))
  const placed: Array<{ lesson: Lesson; lane: number; lanes: number }> = []
  let group: typeof placed = []
  let groupEnd = -1
  const laneEnds: number[] = []

  const closeGroup = () => {
    const lanes = Math.max(1, ...group.map((g) => g.lane + 1))
    group.forEach((g) => (g.lanes = lanes))
    group = []
    laneEnds.length = 0
  }

  for (const lesson of sorted) {
    const start = minutes(lesson.course.start_time)
    const end = minutes(lesson.course.end_time)
    if (start >= groupEnd && group.length > 0) closeGroup()
    let lane = laneEnds.findIndex((e) => e <= start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    const item = { lesson, lane, lanes: 1 }
    group.push(item)
    placed.push(item)
    groupEnd = Math.max(groupEnd, end)
  }
  if (group.length > 0) closeGroup()
  return placed
}

/** First and last hour shown in a time grid: the lessons with an hour of room on each side, at least 6 hours. */
export function hourRange(lessons: Lesson[]) {
  if (lessons.length === 0) return { from: 9, to: 21 }
  let from = Math.max(0, Math.floor(Math.min(...lessons.map((l) => minutes(l.course.start_time))) / 60) - 1)
  let to = Math.min(24, Math.ceil(Math.max(...lessons.map((l) => minutes(l.course.end_time))) / 60) + 1)
  while (to - from < 6) {
    if (to < 24) to++
    if (to - from < 6 && from > 0) from--
  }
  return { from, to }
}
