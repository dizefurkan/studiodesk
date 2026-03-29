'use server'

import { redirect } from 'next/navigation'

export async function changeLanguage(newPath: string) {
  redirect(newPath)
}
