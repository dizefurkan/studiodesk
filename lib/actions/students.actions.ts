'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import type { Database } from '@/lib/types/database.types'

type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

export async function getStudents(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    
    let query = (admin as any)
      .from('students')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching students:', error)
      return { error: 'Failed to fetch students' }
    }

    return { data: data as Student[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getStudentsWithStats(
  searchQuery?: string, 
  page: number = 1, 
  limit: number = 10,
  filters?: {
    hasCredits?: boolean
    danceTypeId?: string
    courseId?: string
    branchId?: string
  }
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Check if we have client-side filters that require fetching all data
    const hasClientSideFilters = filters?.hasCredits || filters?.courseId || filters?.branchId

    // Build count query (for total count)
    let countQuery = adminSupabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organization.id)

    let dataQuery = adminSupabase
      .from('students')
      .select(`
        id, 
        first_name, 
        last_name, 
        email, 
        phone,
        created_at,
        student_packages(
          id,
          remaining_credits,
          package:packages(id, name, dance_type_id, dance_types:dance_types(id, name))
        ),
        course_students(
          course_id,
          course:courses(id, name, branch_id)
        )
      `)
      .eq('organization_id', organization.id)

    // Apply search filter to both queries
    if (searchQuery) {
      const searchFilter = `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      countQuery = countQuery.or(searchFilter)
      dataQuery = dataQuery.or(searchFilter)
    }

    // Apply dance type filter (can be done at DB level)
    if (filters?.danceTypeId && !hasClientSideFilters) {
      dataQuery = dataQuery.select(`
        id, 
        first_name, 
        last_name, 
        email, 
        phone,
        created_at,
        student_packages!inner(
          id,
          remaining_credits,
          package!inner(dance_type_id)
        ),
        course_students(
          course_id,
          course:courses(branch_id, id)
        )
      `)
      dataQuery = (dataQuery as any).eq('student_packages.package.dance_type_id', filters.danceTypeId)
    }

    // Get total count BEFORE pagination
    const { count: totalCount } = await countQuery

    // Order by created_at
    dataQuery = dataQuery.order('created_at', { ascending: false })

    // Only apply pagination if NO client-side filters
    if (!hasClientSideFilters) {
      const offset = (page - 1) * limit
      dataQuery = dataQuery.range(offset, offset + limit - 1)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error('Error fetching students with stats:', error)
      return { error: 'Failed to fetch students' }
    }

    // Process data to add calculated stats and apply client-side filters
    let studentsWithStats = (data || []).map((student: any) => {
      const totalCredits = (student.student_packages || []).reduce(
        (sum: number, sp: any) => sum + (sp.remaining_credits || 0),
        0
      )
      const activeCourses = (student.course_students || [])
        .map((cs: any) => cs.course)
        .filter(Boolean)
      const branches = (student.course_students || [])
        .map((cs: any) => cs.course?.branch_id)
        .filter(Boolean)
      const courseNames = (student.course_students || [])
        .map((cs: any) => cs.course?.name)
        .filter(Boolean)

      return {
        ...student,
        totalRemainingCredits: totalCredits,
        enrolledCoursesCount: activeCourses.length,
        enrolledCourseNames: courseNames,
        enrolledCourses: activeCourses,
        branchIds: branches,
        packageDetails: (student.student_packages || []).map((sp: any) => ({
          name: sp.package?.name || 'Unknown Package',
          danceType: sp.package?.dance_types?.name || sp.package?.dance_type_id || 'Unknown',
          remaining: sp.remaining_credits,
        })),
      }
    })

    // Apply client-side filters (AFTER fetching all data)
    if (filters?.hasCredits) {
      studentsWithStats = studentsWithStats.filter(s => s.totalRemainingCredits > 0)
    }

    if (filters?.courseId) {
      studentsWithStats = studentsWithStats.filter(s => 
        s.enrolledCourseIds.includes(filters.courseId!)
      )
    }

    if (filters?.branchId) {
      studentsWithStats = studentsWithStats.filter(s => 
        s.branchIds.includes(filters.branchId!)
      )
    }

    if (filters?.danceTypeId && hasClientSideFilters) {
      studentsWithStats = studentsWithStats.filter(s =>
        (s.student_packages || []).some((sp: any) => sp.package?.dance_type_id === filters.danceTypeId)
      )
    }

    // Apply pagination to filtered results
    let paginatedStudents = studentsWithStats
    let finalTotal = totalCount || 0
    
    if (hasClientSideFilters) {
      finalTotal = studentsWithStats.length
      const offset = (page - 1) * limit
      paginatedStudents = studentsWithStats.slice(offset, offset + limit)
    }

    const totalPages = Math.ceil(finalTotal / limit)

    return { 
      data: paginatedStudents,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get filter options for students page
 */
export async function getStudentFilterOptions() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    // Get dance types
    const { data: danceTypes } = await adminSupabase
      .from('dance_types')
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    // Get branches
    const { data: branches } = await adminSupabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    // Get courses
    const { data: courses } = await adminSupabase
      .from('courses')
      .select('id, name, branch_id')
      .eq('organization_id', organization.id)
      .order('name')

    return {
      danceTypes: danceTypes || [],
      branches: branches || [],
      courses: courses || [],
    }
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return { error: 'Failed to fetch filter options', danceTypes: [], branches: [], courses: [] }
  }
}

export async function getStudentsWithPackages(searchQuery?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const adminSupabase = createAdminClient()

    let query = adminSupabase
      .from('students')
      .select(`
        id, 
        first_name, 
        last_name, 
        email, 
        phone,
        student_packages(
          id, 
          remaining_credits,
          package:packages(id, name, dance_type_id)
        )
      `)
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching students with packages:', error)
      return { error: 'Failed to fetch students' }
    }

    return { data: data as any[] }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getStudent(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const admin = createAdminClient()
    const { data, error } = await (admin as any)
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (error) {
      console.error('Error fetching student:', error)
      return { error: 'Student not found' }
    }

    return { data: data as Student }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface CreateStudentInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  notes?: string
}

export async function createStudent(input: CreateStudentInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('students')
      .insert({
        organization_id: organization.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone || null,
        notes: input.notes || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return { error: 'Failed to create student' }
    }

    return { data: data as Student, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface UpdateStudentInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
  notes?: string | null
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Verify student belongs to organization
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single()

    if (!student) {
      return { error: 'Student not found or does not belong to your organization' }
    }

    const updateData: StudentUpdate = {}
    if (input.firstName !== undefined) updateData.first_name = input.firstName
    if (input.lastName !== undefined) updateData.last_name = input.lastName
    if (input.email !== undefined) updateData.email = input.email
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.notes !== undefined) updateData.notes = input.notes

    const { data, error } = await (supabase.from('students') as any)
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organization.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating student:', error)
      return { error: 'Failed to update student' }
    }

    return { data: data as Student, success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteStudent(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization.id)

    if (error) {
      console.error('Error deleting student:', error)
      return { error: 'Failed to delete student' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// ===========================
// STUDENT PACKAGES & CREDITS
// ===========================

export async function getStudentPackages(studentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const admin = createAdminClient()
    const { data, error } = await (admin as any)
      .from('student_packages')
      .select('*, packages(name, total_credits, price, dance_types(name))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching student packages:', error)
      return { error: 'Failed to fetch packages' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

interface PurchasePackageInput {
  studentId: string
  packageId: string
  price?: number // Allow override of package price
  paymentMethod?: string
}

export async function purchasePackage(input: PurchasePackageInput) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const organization = await getOrganization()
  if (!organization) return { error: 'No organization found' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get student to find their branch
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, organization_id')
      .eq('id', input.studentId)
      .eq('organization_id', organization.id)
      .single()

    if (studentError || !student) {
      return { error: 'Student not found' }
    }

    // Get package details
    const { data: packageData, error: packageError } = await (supabase
      .from('packages') as any)
      .select('*')
      .eq('id', input.packageId)
      .eq('organization_id', organization.id)
      .single()

    if (packageError || !packageData) {
      return { error: 'Package not found' }
    }

    const price = input.price || packageData.price

    // Create student_packages record
    const { data: studentPackage, error: spError } = await (supabase
      .from('student_packages') as any)
      .insert({
        student_id: input.studentId,
        package_id: input.packageId,
        remaining_credits: packageData.total_credits,
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (spError || !studentPackage) {
      console.error('Error creating student package:', spError)
      return { error: 'Failed to create package record' }
    }

    // Get the first branch for this organization to record transaction
    const { data: branchesData } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', organization.id)
      .limit(1)

    const branchId = branchesData && Array.isArray(branchesData) && branchesData.length > 0 ? (branchesData[0] as any).id : null

    // Create cash transaction if we have a branch
    if (branchId) {
      const { error: transError } = await (supabase
        .from('cash_transactions') as any)
        .insert({
          branch_id: branchId,
          type: 'income',
          amount: price,
          description: `${packageData.name} - Student Purchase`,
          student_package_id: studentPackage.id,
        })

      if (transError) {
        console.error('Error creating transaction:', transError)
        // Don't fail the whole operation if transaction fails
      }
    }

    return {
      success: true,
      data: studentPackage,
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function reduceStudentCredits(studentPackageId: string, amount: number = 1) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get current credits
    const { data: studentPackage, error: fetchError } = await (supabase
      .from('student_packages') as any)
      .select('remaining_credits')
      .eq('id', studentPackageId)
      .single()

    if (fetchError || !studentPackage) {
      return { error: 'Package not found' }
    }

    const newCredits = Math.max(0, studentPackage.remaining_credits - amount)

    // Update credits
    const { data, error } = await (supabase
      .from('student_packages') as any)
      .update({
        remaining_credits: newCredits,
      })
      .eq('id', studentPackageId)
      .select()
      .single()

    if (error) {
      console.error('Error updating credits:', error)
      return { error: 'Failed to update credits' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
