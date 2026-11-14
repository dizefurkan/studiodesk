/** `data` of each union member that has one (distributes over `{ data } | { error }` results). */
type DataOf<R> = R extends unknown ? ('data' extends keyof R ? R['data' & keyof R] : never) : never

/**
 * The `data` a server action returns on success, derived from the action itself so UI
 * props never drift from the query: `ActionData<typeof getCourseAttendanceHistory>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic constraint over any action signature
export type ActionData<F extends (...args: any[]) => Promise<unknown>> = NonNullable<
  DataOf<Awaited<ReturnType<F>>>
>
