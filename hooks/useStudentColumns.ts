import { useState, useEffect } from 'react'

export interface StudentColumns {
  name: boolean
  email: boolean
  phone: boolean
  credits: boolean
  courses: boolean
  joined: boolean
  actions: boolean
}

const DEFAULT_COLUMNS: StudentColumns = {
  name: true,
  email: true,
  phone: true,
  credits: true,
  courses: true,
  joined: true,
  actions: true,
}

export function useStudentColumns() {
  const [columns, setColumns] = useState<StudentColumns>(DEFAULT_COLUMNS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studentTableColumns')
    if (saved) {
      try {
        setColumns(JSON.parse(saved))
      } catch {
        setColumns(DEFAULT_COLUMNS)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when columns change
  const updateColumns = (newColumns: StudentColumns) => {
    setColumns(newColumns)
    localStorage.setItem('studentTableColumns', JSON.stringify(newColumns))
  }

  const toggleColumn = (column: keyof StudentColumns) => {
    const updated = { ...columns, [column]: !columns[column] }
    updateColumns(updated)
  }

  const resetColumns = () => {
    updateColumns(DEFAULT_COLUMNS)
  }

  return { columns, toggleColumn, resetColumns, isLoaded }
}
