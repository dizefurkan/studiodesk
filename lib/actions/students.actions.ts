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
    const hasClientSideFilters = filters?.hasCredits || filters?.courseId || filters?.branchId || filters?.danceTypeId

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
      console.error('Error fetching students with stats:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      return { error: `Failed to fetch students: ${error.message || JSON.stringify(error)}` }
    }

    // Fetch student_packages separately (RLS works better this way)
    const studentIds = data?.map((s: any) => s.id) || []
    let studentPackages: any[] = []
    if (studentIds.length > 0) {
      const { data: packagesData } = await adminSupabase
        .from('student_packages')
        .select('id, remaining_credits, package_id, student_id')
        .in('student_id', studentIds)
      studentPackages = packagesData || []
      console.log(`Fetched ${studentPackages.length} student_packages for ${studentIds.length} students`)
    }

    // Merge student_packages into students data
    const studentPackagesByStudentId = new Map<string, any[]>()
    studentPackages.forEach(sp => {
      if (!studentPackagesByStudentId.has(sp.student_id)) {
        studentPackagesByStudentId.set(sp.student_id, [])
      }
      studentPackagesByStudentId.get(sp.student_id)!.push(sp)
    })

    data?.forEach((student: any) => {
      student.student_packages = studentPackagesByStudentId.get(student.id) || []
    })

    // Fetch packages and create mapping for dance_type
    let packageDanceTypeMap = new Map<string, string>()
    const packageIds = studentPackages.map(sp => sp.package_id).filter(Boolean)
    
    if (packageIds.length > 0) {
      const { data: packagesData } = await adminSupabase
        .from('packages')
        .select('id, dance_type_id')
        .in('id', packageIds)
      
      if (packagesData) {
        packagesData.forEach(pkg => {
          packageDanceTypeMap.set(pkg.id, pkg.dance_type_id)
        })
      }
    }

    // Enrich student_packages with dance_type_id from packages
    data?.forEach((student: any) => {
      if (student.student_packages) {
        student.student_packages = student.student_packages.map((sp: any) => ({
          ...sp,
          packages: {
            id: sp.package_id,
            dance_type_id: packageDanceTypeMap.get(sp.package_id)
          }
        }))
      }
    })

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
      const courseIds = (student.course_students || [])
        .map((cs: any) => cs.course?.id)
        .filter(Boolean)

      return {
        ...student,
        totalRemainingCredits: totalCredits,
        enrolledCoursesCount: activeCourses.length,
        enrolledCourseNames: courseNames,
        enrolledCourseIds: courseIds,
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

    if (filters?.danceTypeId) {
      console.log(`Filtering students by danceTypeId: ${filters.danceTypeId}`)
      console.log(`Total students before filter: ${studentsWithStats.length}`)
      
      // Debug: show sample student packages
      if (studentsWithStats.length > 0) {
        const sampleStudent = studentsWithStats[0]
        console.log(`Sample student packages:`, {
          studentId: sampleStudent.id,
          packages: sampleStudent.student_packages?.map(sp => ({
            packageId: sp.packages?.id,
            packageName: sp.packages?.name,
            danceTypeId: sp.packages?.dance_type_id,
            remainingCredits: sp.remaining_credits
          }))
        })
      }
      
      studentsWithStats = studentsWithStats.filter(s => {
        const hasMatchingDanceType = (s.student_packages || []).some((sp: any) => {
          const matches = sp.packages?.dance_type_id === filters.danceTypeId
          return matches
        })
        return hasMatchingDanceType
      })
      console.log(`After dance type filter: ${studentsWithStats.length} students`)
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

    // Get dance types list
    const { data: danceTypesList } = await adminSupabase
      .from('dance_types')
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    // Get student counts per dance type
    const { data: studentsByDanceType } = await adminSupabase
      .from('student_packages')
      .select('packages(dance_type_id)', { count: 'exact' })

    // Count students per dance type
    const danceTypeCounts = new Map<string, number>()
    if (studentsByDanceType) {
      danceTypesList?.forEach(dt => {
        const count = (studentsByDanceType as any[]).filter(
          sp => sp.packages?.dance_type_id === dt.id
        ).length
        danceTypeCounts.set(dt.id, count)
      })
    }

    const danceTypes = (danceTypesList || []).map(dt => ({
      ...dt,
      studentCount: danceTypeCounts.get(dt.id) || 0
    }))

    // Get branches list
    const { data: branchesList } = await adminSupabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', organization.id)
      .order('name')

    // Get courses list via branches (courses table has no organization_id, only branch_id)
    const { data: coursesList } = await adminSupabase
      .from('courses')
      .select('id, name, branch_id')
      .in('branch_id', branchesList?.map(b => b.id) || [])
      .order('name')

    // Get student counts per course
    const { data: studentsByCourse } = await adminSupabase
      .from('course_students')
      .select('student_id, course_id')

    // Calculate branch student counts from coursesList and studentsByCourse
    const branchStudentSets = new Map<string, Set<string>>()
    coursesList?.forEach(course => {
      if (!branchStudentSets.has(course.branch_id)) {
        branchStudentSets.set(course.branch_id, new Set())
      }
      const courseStudents = (studentsByCourse || [])
        .filter(cs => cs.course_id === course.id)
        .map(cs => cs.student_id)
        .filter(Boolean)
      
      courseStudents.forEach(studentId => {
        branchStudentSets.get(course.branch_id)!.add(studentId)
      })
    })

    const branchCounts = new Map<string, number>()
    branchStudentSets.forEach((studentSet, branchId) => {
      branchCounts.set(branchId, studentSet.size)
    })

    const branches = (branchesList || []).map(branch => ({
      ...branch,
      studentCount: branchCounts.get(branch.id) || 0
    }))

    // Calculate course student counts
    const courseCounts = new Map<string, number>()
    coursesList?.forEach(course => {
      const uniqueStudents = new Set(
        (studentsByCourse || [])
          .filter(cs => cs.course_id === course.id)
          .map(cs => cs.student_id)
          .filter(Boolean)
      )
      courseCounts.set(course.id, uniqueStudents.size)
    })

    const courses = (coursesList || []).map(course => ({
      ...course,
      studentCount: courseCounts.get(course.id) || 0
    }))

    console.log('Filter options loaded:', {
      danceTypesCount: danceTypes.length,
      branchesCount: branches.length,
      coursesCount: courses.length,
      branchStudentCounts: Array.from(branchCounts.entries()),
      courseStudentCounts: Array.from(courseCounts.entries()),
    })

    return {
      danceTypes,
      branches,
      courses,
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

export async function increaseStudentCredits(studentPackageId: string, amount: number = 1) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get current credits and total from packages table
    const { data: studentPackage, error: fetchError } = await (supabase
      .from('student_packages') as any)
      .select('id, remaining_credits, package:packages(total_credits)')
      .eq('id', studentPackageId)
      .single()

    if (fetchError || !studentPackage) {
      return { error: 'Package not found' }
    }

    const totalCredits = studentPackage.package?.total_credits || 0
    // Don't exceed total credits
    const newCredits = Math.min(totalCredits, studentPackage.remaining_credits + amount)

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

export async function updateStudentPackageCredits(
  studentPackageId: string,
  newCreditsAmount: number,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const supabase = await createServerSupabaseClient()

    // Get package info with total_credits from packages table
    const { data: studentPackage, error: fetchError } = await (supabase
      .from('student_packages') as any)
      .select('id, remaining_credits, package:packages(total_credits)')
      .eq('id', studentPackageId)
      .single()

    if (fetchError) {
      console.error('Error fetching student package:', fetchError)
      console.error('Student Package ID:', studentPackageId)
      return { error: `Failed to fetch package: ${fetchError.message}` }
    }

    if (!studentPackage) {
      console.error('Student package not found for ID:', studentPackageId)
      return { error: 'Package not found' }
    }

    const totalCredits = studentPackage.package?.total_credits || 0

    // Ensure credits don't exceed total or go below 0
    const finalCredits = Math.max(0, Math.min(newCreditsAmount, totalCredits))

    // Update credits
    const { data, error } = await (supabase
      .from('student_packages') as any)
      .update({
        remaining_credits: finalCredits,
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
