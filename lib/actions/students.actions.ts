"use server";

import { unstable_rethrow } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getOrganization } from "@/lib/auth/getOrganization";
import { logOperation } from "@/lib/actions/history.actions";
import { getChanges } from "@/lib/utils/history-utils";
import type { Database } from "@/lib/types/database.types";
import { sanitizeSearch } from '@/lib/utils/search'
import { actionError } from '@/lib/i18n/actionError'

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export async function getStudents(searchQuery?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const admin = createAdminClient();

    let query = admin
      .from("students")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${sanitizeSearch(searchQuery)}%,last_name.ilike.%${sanitizeSearch(searchQuery)}%,email.ilike.%${sanitizeSearch(searchQuery)}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching students:", error);
      return { error: await actionError('fetchStudentsFailed') };
    }

    return { data: data as Student[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export async function getStudentsWithStats(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  danceTypeId?: string,
  branchId?: string,
  courseId?: string,
  hasCredits?: boolean,
  /** active (default) | passive | all */
  status: StudentStatusFilter = 'active'
) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated'), data: [], totalCount: 0 };

  const organization = await getOrganization();
  if (!organization)
    return { error: await actionError('noOrganization'), data: [], totalCount: 0 };

  try {
    const adminSupabase = createAdminClient();

    // If we need to filter by danceType or hasCredits, we need to get student IDs first
    let filteredStudentIds: Set<string> = new Set();
    let hasFilteringActive = false;

    console.log("[DEBUG] getStudentsWithStats called with:", {
      searchQuery,
      page,
      pageSize,
      danceTypeId,
      branchId,
      courseId,
      hasCredits,
    });

    if (danceTypeId || hasCredits) {
      hasFilteringActive = true;

      // Step 1: Get package IDs for the dance type
      let packageIds: string[] = [];
      if (danceTypeId) {
        const { data: packagesData } = await adminSupabase
          .from("packages")
          .select("id")
          .eq("dance_type_id", danceTypeId)
          .eq("organization_id", organization.id);

        packageIds = packagesData?.map((p) => p.id) || [];

        if (packageIds.length === 0) {
          return {
            data: [],
            totalCount: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
      }

      // Step 2: Get student IDs from student_packages
      let filterQuery = adminSupabase
        .from("student_packages")
        .select("student_id");

      if (danceTypeId && packageIds.length > 0) {
        filterQuery = filterQuery.in("package_id", packageIds);
      }

      if (hasCredits) {
        filterQuery = filterQuery.gt("remaining_credits", 0);
      }

      let packageData: { student_id: string }[] = [];
      try {
        const response = await filterQuery;
        packageData = response.data || [];
      } catch (e) {
        console.error("Error fetching filtered packages:", e);
      }

      packageData.forEach((p) => {
        if (p?.student_id) {
          filteredStudentIds.add(p.student_id);
        }
      });

      console.log(
        "[DEBUG] Filtered student IDs:",
        Array.from(filteredStudentIds)
      );

      // If no students match the dance type filter, return empty result
      if (filteredStudentIds.size === 0) {
        return {
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
    }

    // If we need to filter by branch or course, get student IDs
    if (branchId) {
      hasFilteringActive = true;
      // Step 1: Get courses for this branch
      const { data: courseData } = await adminSupabase
        .from("courses")
        .select("id")
        .eq("branch_id", branchId);

      const courseIds = (courseData || []).map((c) => c.id);
      console.log("[DEBUG] Found courses for branch:", courseIds);

      if (courseIds.length > 0) {
        // Step 2: Get students enrolled in these courses
        const { data: enrollmentData } = await adminSupabase
          .from("course_students")
          .select("student_id")
          .in("course_id", courseIds);

        const branchStudentIds = new Set<string>(
          (enrollmentData || []).map(
            (e) => e.student_id as string
          )
        );
        console.log(
          "[DEBUG] Filtered student IDs from branch:",
          Array.from(branchStudentIds)
        );

        if (filteredStudentIds.size === 0) {
          filteredStudentIds = branchStudentIds;
        } else {
          // Intersect with existing filters
          filteredStudentIds = new Set(
            [...filteredStudentIds].filter((id) => branchStudentIds.has(id))
          );
        }
      } else {
        return {
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
    }

    if (courseId) {
      hasFilteringActive = true;
      const { data: enrollmentData } = await adminSupabase
        .from("course_students")
        .select("student_id")
        .eq("course_id", courseId);

      const courseStudentIds = new Set<string>(
        (enrollmentData || []).map((e) => e.student_id as string)
      );

      if (filteredStudentIds.size === 0) {
        filteredStudentIds = courseStudentIds;
      } else {
        // Intersect with existing filters
        filteredStudentIds = new Set(
          [...filteredStudentIds].filter((id) => courseStudentIds.has(id))
        );
      }

      if (filteredStudentIds.size === 0) {
        return {
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
    }

    // Build queries for counting and fetching data
    let countQuery = adminSupabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null);
    if (status !== 'all') countQuery = countQuery.eq("is_active", status === 'active');

    let dataQuery = adminSupabase
      .from("students")
      .select(
        `
        id, 
        first_name, 
        last_name, 
        email, 
        phone,
        created_at,
        is_active,
        course_students(
          course_id,
          course:courses(id, name, branch_id)
        )
      `
      )
      .eq("organization_id", organization.id)
      .is("deleted_at", null);
    if (status !== 'all') dataQuery = dataQuery.eq("is_active", status === 'active');

    // Apply search filter to both queries
    if (searchQuery) {
      const searchFilter = `first_name.ilike.%${sanitizeSearch(searchQuery)}%,last_name.ilike.%${sanitizeSearch(searchQuery)}%,email.ilike.%${sanitizeSearch(searchQuery)}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Apply combined filter (student IDs from dance type, branch, course, hasCredits)
    if (hasFilteringActive && filteredStudentIds.size > 0) {
      const studentIdArray = Array.from(filteredStudentIds);
      countQuery = countQuery.in("id", studentIdArray);
      dataQuery = dataQuery.in("id", studentIdArray);
    }

    // Get total count
    const { count: totalCount } = await countQuery;
    const count = totalCount || 0;

    // Order by created_at
    dataQuery = dataQuery.order("created_at", { ascending: false });

    // Apply pagination with LIMIT/OFFSET
    const offset = (page - 1) * pageSize;
    dataQuery = dataQuery.range(offset, offset + pageSize - 1);

    const { data, error } = await dataQuery;

    if (error) {
      console.error("Error fetching students with stats:", error);
      return {
        error: `Failed to fetch students: ${error.message}`,
        data: [],
        totalCount: 0,
      };
    }

    // Fetch student_packages
    const studentIds = data?.map((s) => s.id) || [];
    type StudentPackageRow = { id: string; remaining_credits: number; package_id: string; student_id: string };
    let studentPackages: StudentPackageRow[] = [];
    if (studentIds.length > 0) {
      const { data: packagesData } = await adminSupabase
        .from("student_packages")
        .select("id, remaining_credits, package_id, student_id")
        .in("student_id", studentIds);
      studentPackages = packagesData || [];
    }

    // Merge student_packages
    const studentPackagesByStudentId = new Map<string, StudentPackageRow[]>();
    studentPackages.forEach((sp) => {
      if (!studentPackagesByStudentId.has(sp.student_id)) {
        studentPackagesByStudentId.set(sp.student_id, []);
      }
      studentPackagesByStudentId.get(sp.student_id)!.push(sp);
    });

    // Fetch packages and dance types mapping
    const packageDanceTypeMap = new Map<string, { id: string; name: string }>();
    const packageIds = studentPackages
      .map((sp) => sp.package_id)
      .filter(Boolean);

    if (packageIds.length > 0) {
      const { data: packagesData } = await adminSupabase.from("packages")
        .select("id, dance_type_id")
        .in("id", packageIds);

      if (packagesData) {
        const packages = packagesData;
        const danceTypeIds = [
          ...new Set(
            packages.map((pkg) => pkg.dance_type_id).filter(Boolean)
          ),
        ];

        if (danceTypeIds.length > 0) {
          const { data: danceTypesData } = await adminSupabase.from("dance_types")
            .select("id, name")
            .in("id", danceTypeIds);

          const danceTypeMap = new Map<string, string>();
          if (danceTypesData) {
            danceTypesData.forEach((dt) => {
              danceTypeMap.set(dt.id, dt.name);
            });
          }

          packages.forEach((pkg) => {
            packageDanceTypeMap.set(pkg.id, {
              id: pkg.dance_type_id,
              name: danceTypeMap.get(pkg.dance_type_id) || "Unknown",
            });
          });
        }
      }
    }

    // Add calculated stats
    const studentsWithStats = (data || []).map((student) => {
      // student_packages enriched with their dance type
      const student_packages = (studentPackagesByStudentId.get(student.id) || []).map((sp) => ({
        ...sp,
        packages: {
          id: sp.package_id,
          dance_type_id: packageDanceTypeMap.get(sp.package_id)?.id,
          dance_type_name: packageDanceTypeMap.get(sp.package_id)?.name,
        },
      }));
      const totalCredits = student_packages.reduce(
        (sum: number, sp) => sum + (sp.remaining_credits || 0),
        0
      );
      const activeCourses = (student.course_students || [])
        .map((cs) => cs.course)
        .filter(Boolean);
      const branches = (student.course_students || [])
        .map((cs) => cs.course?.branch_id)
        .filter(Boolean);
      const courseNames = (student.course_students || [])
        .map((cs) => cs.course?.name)
        .filter(Boolean);
      const courseIds = (student.course_students || [])
        .map((cs) => cs.course?.id)
        .filter(Boolean);

      return {
        ...student,
        student_packages,
        totalRemainingCredits: totalCredits,
        enrolledCoursesCount: activeCourses.length,
        enrolledCourseNames: courseNames,
        enrolledCourseIds: courseIds,
        enrolledCourses: activeCourses,
        branchIds: branches,
        packageDetails: student_packages.map((sp) => ({
          id: sp.package_id,
          name: sp.packages?.id || "Unknown Package",
          danceType: sp.packages?.dance_type_name || "Unknown",
          danceTypeId: sp.packages?.dance_type_id,
          remaining: sp.remaining_credits,
        })),
      };
    });

    return {
      data: studentsWithStats,
      totalCount: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected'), data: [], totalCount: 0 };
  }
}

/**
 * Get filter options for students page
 */
export async function getStudentFilterOptions() {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const adminSupabase = createAdminClient();

    // Get dance types list
    const { data: danceTypesData } = await adminSupabase.from("dance_types")
      .select("id, name")
      .eq("organization_id", organization.id)
      .order("name");

    const danceTypesList = danceTypesData;

    // Get student counts per dance type
    const { data: studentsByDanceType } = await adminSupabase.from("student_packages").select("packages(dance_type_id), students!inner(organization_id)", { count: "exact" }).eq("students.organization_id", organization.id);

    // Count students per dance type
    const danceTypeCounts: Record<string, number> = {};
    if (studentsByDanceType) {
      danceTypesList?.forEach((dt) => {
        const count = studentsByDanceType.filter(
          (sp) => sp.packages?.dance_type_id === dt.id
        ).length;
        danceTypeCounts[dt.id] = count;
      });
    }

    const danceTypes = ((danceTypesList || [])).map((dt) => ({
      ...dt,
      studentCount: danceTypeCounts[dt.id] || 0,
    }));

    // Get branches list
    const { data: branchesData } = await adminSupabase.from("branches")
      .select("id, name")
      .eq("organization_id", organization.id)
      .order("name");

    const branchesList = branchesData;

    // Get courses list via branches (courses table has no organization_id, only branch_id)
    const { data: coursesData } = await adminSupabase.from("courses")
      .select("id, name, branch_id, dance_type_id")
      .in("branch_id", (branchesList || [])?.map((b) => b.id) || [])
      .order("name");

    const coursesList = coursesData;

    // Get student counts per course
    const { data: studentsByCoursData } = await adminSupabase
      .from("course_students")
      .select("student_id, course_id")
      .in("course_id", (coursesList || []).map((c) => c.id));

    const studentsByCourse = studentsByCoursData;

    // Calculate branch student counts from coursesList and studentsByCourse
    const branchStudentSetsArray: Array<[string, Set<string>]> = [] as Array<
      [string, Set<string>]
    >;
    (coursesList || []).forEach((course) => {
      let branchSet = branchStudentSetsArray.find(
        ([id]) => id === course.branch_id
      );
      if (!branchSet) {
        branchSet = [course.branch_id, new Set()];
        branchStudentSetsArray.push(branchSet);
      }
      const courseStudents = (studentsByCourse || [])
        .filter((cs) => cs.course_id === course.id)
        .map((cs) => cs.student_id)
        .filter(Boolean);

      courseStudents.forEach((studentId) => {
        branchSet[1].add(studentId);
      });
    });

    const branchCounts = {} as Record<string, number>;
    branchStudentSetsArray.forEach(([branchId, studentSet]) => {
      branchCounts[branchId] = studentSet.size;
    });

    const branches = ((branchesList || [])).map((branch) => ({
      ...branch,
      studentCount: branchCounts[branch.id] || 0,
    }));

    // Calculate course student counts
    const courseCounts = {} as Record<string, number>;
    (coursesList || []).forEach((course) => {
      const uniqueStudents = new Set(
        (studentsByCourse || [])
          .filter((cs) => cs.course_id === course.id)
          .map((cs) => cs.student_id)
          .filter(Boolean)
      );
      courseCounts[course.id] = uniqueStudents.size;
    });

    const courses = ((coursesList || [])).map((course) => ({
      ...course,
      studentCount: courseCounts[course.id] || 0,
    }));

    console.log("Filter options loaded:", {
      danceTypesCount: danceTypes.length,
      branchesCount: branches.length,
      coursesCount: courses.length,
      branchStudentCounts: Object.entries(branchCounts),
      courseStudentCounts: Object.entries(courseCounts),
    });

    return {
      danceTypes,
      branches,
      courses,
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return {
      error: await actionError('fetchFiltersFailed'),
      danceTypes: [],
      branches: [],
      courses: [],
    };
  }
}

export async function getStudentsWithPackages(searchQuery?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from("students")
      .select(
        `
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
      `
      )
      .eq("organization_id", organization.id)
      // Only students who can be enrolled: not deleted, not passive
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${sanitizeSearch(searchQuery)}%,last_name.ilike.%${sanitizeSearch(searchQuery)}%,email.ilike.%${sanitizeSearch(searchQuery)}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching students with packages:", error);
      return { error: await actionError('fetchStudentsFailed') };
    }

    return { data: data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export async function getStudent(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("students")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single();

    if (error) {
      console.error("Error fetching student:", error);
      return { error: await actionError('studentNotFound') };
    }

    return { data: data as Student };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

interface CreateStudentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  messagesOptOut?: boolean;
}

export async function createStudent(input: CreateStudentInput) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("students")
      .insert({
        organization_id: organization.id,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone || null,
        notes: input.notes || null,
        messages_opt_out: input.messagesOptOut ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating student:", error);
      return { error: await actionError('createStudentFailed') };
    }

    // Log operation (non-blocking)
    void logOperation(
      "CREATE",
      "student",
      data.id,
      {
        after: {
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          notes: data.notes,
        },
      },
      organization.id
    );

    return { data: data as Student, success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  notes?: string | null;
  messagesOptOut?: boolean;
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();

    // Get before state for history log
    const { data: beforeStudent } = await supabase
      .from("students")
      .select("first_name, last_name, email, phone, notes, messages_opt_out")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single();

    if (!beforeStudent) {
      return {
        error: await actionError('studentNotInOrg'),
      };
    }

    const updateData: StudentUpdate = {};
    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.messagesOptOut !== undefined) updateData.messages_opt_out = input.messagesOptOut;

    const { data, error } = await supabase.from("students")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", organization.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating student:", error);
      return { error: await actionError('updateStudentFailed') };
    }

    // Log operation with before/after and changes (non-blocking)
    const beforeObj = {
      firstName: beforeStudent.first_name,
      lastName: beforeStudent.last_name,
      email: beforeStudent.email,
      phone: beforeStudent.phone,
      notes: beforeStudent.notes,
    };
    const afterObj = {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
    };
    const changes = getChanges(beforeObj, afterObj);

    void logOperation(
      "UPDATE",
      "student",
      id,
      {
        before: beforeObj,
        after: afterObj,
        changes,
      },
      organization.id
    );

    return { data: data as Student, success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export async function deleteStudent(id: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();

    // Get before state for history log
    const { data: beforeStudent } = await supabase
      .from("students")
      .select("first_name, last_name, email, phone, notes")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single();

    if (!beforeStudent) {
      return {
        error: await actionError('studentNotInOrg'),
      };
    }

    const user_id = user.id;
    const updateResult = (await supabase.from("students")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq("id", id)
      .eq("organization_id", organization.id));
    const { error } = updateResult;

    if (error) {
      console.error("Error deleting student:", error);
      return { error: await actionError('deleteStudentFailed') };
    }

    // Log operation (non-blocking)
    void logOperation(
      "DELETE",
      "student",
      id,
      {
        before: {
          firstName: beforeStudent.first_name,
          lastName: beforeStudent.last_name,
          email: beforeStudent.email,
          phone: beforeStudent.phone,
          notes: beforeStudent.notes,
        },
      },
      organization.id
    );

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

// ===========================
// STUDENT PACKAGES & CREDITS
// ===========================

export async function getStudentPackages(studentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("student_packages")
      .select("*, packages(name, total_credits, price, dance_types(name)), students!inner(organization_id)")
      .eq("student_id", studentId)
      .eq("students.organization_id", organization.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student packages:", error);
      return { error: await actionError('fetchPackagesFailed') };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

interface PurchasePackageInput {
  studentId: string;
  packageId: string;
  price?: number; // Allow override of package price
  paymentMethod?: string;
}

export async function purchasePackage(input: PurchasePackageInput) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();

    // Get student to find their branch
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, organization_id, first_name, last_name")
      .eq("id", input.studentId)
      .eq("organization_id", organization.id)
      .single();

    if (studentError || !student) {
      return { error: await actionError('studentNotFound') };
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabase.from("packages")
      .select("*")
      .eq("id", input.packageId)
      .eq("organization_id", organization.id)
      .single();

    if (packageError || !packageData) {
      return { error: await actionError('packageNotFound') };
    }

    const price = input.price || packageData.price;

    // Create student_packages record
    const { data: studentPackage, error: spError } = await supabase.from("student_packages")
      .insert({
        student_id: input.studentId,
        package_id: input.packageId,
        remaining_credits: packageData.total_credits,
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (spError || !studentPackage) {
      console.error("Error creating student package:", spError);
      return { error: await actionError('createPackageRecordFailed') };
    }

    // Get the first branch for this organization to record transaction
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", organization.id)
      .limit(1);

    const branchId =
      branchesData && Array.isArray(branchesData) && branchesData.length > 0
        ? branchesData[0].id
        : null;

    // Create cash transaction if we have a branch
    if (branchId) {
      const { error: transError } = await supabase.from("cash_transactions").insert({
        branch_id: branchId,
        type: "income",
        amount: price,
        description: `${packageData.name} – ${student.first_name} ${student.last_name}`,
        student_package_id: studentPackage.id,
      });

      if (transError) {
        console.error("Error creating transaction:", transError);
        // Don't fail the whole operation if transaction fails
      }
    }

    // Log the purchase operation
    void logOperation(
      "CREATE",
      "student_package",
      studentPackage.id,
      {
        after: {
          studentId: input.studentId,
          packageName: packageData.name,
          packageId: input.packageId,
          totalCredits: packageData.total_credits,
          price: price,
        },
      },
      organization.id
    );

    return {
      success: true,
      data: studentPackage,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export async function reduceStudentCredits(
  studentPackageId: string,
  amount: number = 1
) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();

    // Get current credits and package name
    const { data: studentPackage, error: fetchError } = await supabase.from("student_packages")
      .select(
        "remaining_credits, package:packages(name, total_credits), student_id"
      )
      .eq("id", studentPackageId)
      .single();

    if (fetchError || !studentPackage) {
      return { error: await actionError('packageNotFound') };
    }

    const beforeCredits = studentPackage.remaining_credits;
    const newCredits = Math.max(0, beforeCredits - amount);
    const packageName = studentPackage.package?.name || "Unknown Package";

    // Update credits
    const { data, error } = await supabase.from("student_packages")
      .update({
        remaining_credits: newCredits,
      })
      .eq("id", studentPackageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credits:", error);
      return { error: await actionError('updateCreditsFailed') };
    }

    // Log operation (non-blocking)
    void logOperation(
      "UPDATE",
      "student_package",
      studentPackageId,
      {
        before: { remaining_credits: beforeCredits },
        after: { remaining_credits: newCredits },
        changes: {
          remaining_credits: { before: beforeCredits, after: newCredits },
        },
        studentId: studentPackage.student_id,
        packageName: packageName,
      },
      organization.id
    );

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export async function increaseStudentCredits(
  studentPackageId: string,
  amount: number = 1
) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();

    // Get current credits and total from packages table
    const { data: studentPackage, error: fetchError } = await supabase.from("student_packages")
      .select(
        "id, student_id, remaining_credits, package:packages(total_credits, name)"
      )
      .eq("id", studentPackageId)
      .single();

    if (fetchError || !studentPackage) {
      return { error: await actionError('packageNotFound') };
    }

    const totalCredits = studentPackage.package?.total_credits || 0;
    const beforeCredits = studentPackage.remaining_credits;
    // Don't exceed total credits
    const newCredits = Math.min(totalCredits, beforeCredits + amount);
    const packageName = studentPackage.package?.name || "Unknown Package";

    // Update credits
    const { data, error } = await supabase.from("student_packages")
      .update({
        remaining_credits: newCredits,
      })
      .eq("id", studentPackageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credits:", error);
      return { error: await actionError('updateCreditsFailed') };
    }

    // Log operation (non-blocking)
    void logOperation(
      "UPDATE",
      "student_package",
      studentPackageId,
      {
        before: { remaining_credits: beforeCredits },
        after: { remaining_credits: newCredits },
        changes: {
          remaining_credits: { before: beforeCredits, after: newCredits },
        },
        studentId: studentPackage.student_id,
        packageName: packageName,
      },
      organization.id
    );

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export async function updateStudentPackageCredits(
  studentPackageId: string,
  newCreditsAmount: number
) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const supabase = await createServerSupabaseClient();

    // Get package info with total_credits AND student_id from packages table
    const { data: studentPackage, error: fetchError } = await supabase.from("student_packages")
      .select(
        "id, student_id, remaining_credits, package:packages(total_credits, name)"
      )
      .eq("id", studentPackageId)
      .single();

    if (fetchError) {
      console.error("Error fetching student package:", fetchError);
      console.error("Student Package ID:", studentPackageId);
      return { error: `Failed to fetch package: ${fetchError.message}` };
    }

    if (!studentPackage) {
      console.error("Student package not found for ID:", studentPackageId);
      return { error: await actionError('packageNotFound') };
    }

    const totalCredits = studentPackage.package?.total_credits || 0;
    const beforeCredits = studentPackage.remaining_credits;
    const packageName = studentPackage.package?.name || "Unknown Package";

    // Ensure credits don't exceed total or go below 0
    const finalCredits = Math.max(0, Math.min(newCreditsAmount, totalCredits));

    // Update credits
    const { data, error } = await supabase.from("student_packages")
      .update({
        remaining_credits: finalCredits,
      })
      .eq("id", studentPackageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credits:", error);
      return { error: await actionError('updateCreditsFailed') };
    }

    // Log operation (non-blocking)
    void logOperation(
      "UPDATE",
      "student_package",
      studentPackageId,
      {
        before: { remaining_credits: beforeCredits },
        after: { remaining_credits: finalCredits },
        changes: {
          remaining_credits: { before: beforeCredits, after: finalCredits },
        },
        studentId: studentPackage.student_id,
        packageName: packageName,
      },
      organization.id
    );

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: await actionError('unexpected') };
  }
}

export type StudentStatusFilter = 'active' | 'passive' | 'all';

/** How many students are active and passive (deleted students are not counted). */
export async function getStudentStatusCounts() {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  const admin = createAdminClient();
  const base = () =>
    admin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null);
  const [active, passive] = await Promise.all([base().eq("is_active", true), base().eq("is_active", false)]);
  if (active.error || passive.error) return { error: await actionError('fetchStudentsFailed') };
  return { data: { active: active.count ?? 0, passive: passive.count ?? 0 } };
}

/**
 * Makes a student active or passive. A passive student keeps packages, enrolments and history
 * but is left out of attendance sheets, enrolment pickers and active-student counts.
 */
export async function setStudentActive(id: string, active: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: await actionError('notAuthenticated') };

  const organization = await getOrganization();
  if (!organization) return { error: await actionError('noOrganization') };

  try {
    const admin = createAdminClient();
    // Service-role client: scope to the caller's organization in the query itself
    const { data: student } = await admin
      .from("students")
      .select("id, first_name, last_name, is_active")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!student) return { error: await actionError('studentNotInOrg') };
    if (student.is_active === active) return { success: true };

    const { error } = await admin
      .from("students")
      .update({ is_active: active, status_changed_at: new Date().toISOString() })
      .eq("id", student.id)
      .eq("organization_id", organization.id);
    if (error) {
      console.error("Error changing student status:", error);
      return { error: await actionError('updateStudentStatusFailed') };
    }

    void logOperation(
      "UPDATE",
      "student",
      student.id,
      {
        before: { isActive: student.is_active },
        after: { isActive: active },
        changes: { isActive: { before: student.is_active, after: active } },
        studentName: `${student.first_name} ${student.last_name}`,
      },
      organization.id
    );
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Unexpected error in setStudentActive:", error);
    return { error: await actionError('unexpected') };
  }
}
