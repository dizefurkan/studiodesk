"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getOrganization } from "@/lib/auth/getOrganization";
import { logOperation } from "@/lib/actions/history.actions";
import { getChanges } from "@/lib/utils/history-utils";
import type { Database } from "@/lib/types/database.types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export async function getStudents(searchQuery?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const admin = createAdminClient();

    let query = (admin as any)
      .from("students")
      .select("*")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching students:", error);
      return { error: "Failed to fetch students" };
    }

    return { data: data as Student[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getStudentsWithStats(
  searchQuery?: string,
  page: number = 1,
  pageSize: number = 10,
  danceTypeId?: string,
  branchId?: string,
  courseId?: string,
  hasCredits?: boolean
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated", data: [], totalCount: 0 };

  const organization = await getOrganization();
  if (!organization)
    return { error: "No organization found", data: [], totalCount: 0 };

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

        packageIds = (packagesData as any[])?.map((p: any) => p.id) || [];

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
      let filterQuery: any = adminSupabase
        .from("student_packages")
        .select("student_id");

      if (danceTypeId && packageIds.length > 0) {
        filterQuery = filterQuery.in("package_id", packageIds);
      }

      if (hasCredits) {
        filterQuery = filterQuery.gt("remaining_credits", 0);
      }

      let packageData: any[] = [];
      try {
        const response: any = await filterQuery;
        packageData = response?.data || [];
      } catch (e) {
        console.error("Error fetching filtered packages:", e);
      }

      (packageData as any[]).forEach((p: any) => {
        if (p?.student_id) {
          filteredStudentIds.add(p.student_id as string);
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

      const courseIds = ((courseData as any) || []).map((c: any) => c.id);
      console.log("[DEBUG] Found courses for branch:", courseIds);

      if (courseIds.length > 0) {
        // Step 2: Get students enrolled in these courses
        const { data: enrollmentData } = await adminSupabase
          .from("course_students")
          .select("student_id")
          .in("course_id", courseIds);

        const branchStudentIds = new Set<string>(
          ((enrollmentData as any) || []).map(
            (e: any) => e.student_id as string
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
        ((enrollmentData as any) || []).map((e: any) => e.student_id as string)
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
        course_students(
          course_id,
          course:courses(id, name, branch_id)
        )
      `
      )
      .eq("organization_id", organization.id)
      .is("deleted_at", null);

    // Apply search filter to both queries
    if (searchQuery) {
      const searchFilter = `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`;
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
    const studentIds = data?.map((s: any) => s.id) || [];
    let studentPackages: any[] = [];
    if (studentIds.length > 0) {
      const { data: packagesData } = await adminSupabase
        .from("student_packages")
        .select("id, remaining_credits, package_id, student_id")
        .in("student_id", studentIds);
      studentPackages = packagesData || [];
    }

    // Merge student_packages
    const studentPackagesByStudentId = new Map<string, any[]>();
    studentPackages.forEach((sp) => {
      if (!studentPackagesByStudentId.has(sp.student_id)) {
        studentPackagesByStudentId.set(sp.student_id, []);
      }
      studentPackagesByStudentId.get(sp.student_id)!.push(sp);
    });

    data?.forEach((student: any) => {
      student.student_packages =
        studentPackagesByStudentId.get(student.id) || [];
    });

    // Fetch packages and dance types mapping
    const packageDanceTypeMap = new Map<string, { id: string; name: string }>();
    const packageIds = studentPackages
      .map((sp) => sp.package_id)
      .filter(Boolean);

    if (packageIds.length > 0) {
      const { data: packagesData } = await (
        adminSupabase.from("packages") as any
      )
        .select("id, dance_type_id")
        .in("id", packageIds);

      if (packagesData) {
        const packages = packagesData as any;
        const danceTypeIds = [
          ...new Set(
            packages.map((pkg: any) => pkg.dance_type_id).filter(Boolean)
          ),
        ];

        if (danceTypeIds.length > 0) {
          const { data: danceTypesData } = await (
            adminSupabase.from("dance_types") as any
          )
            .select("id, name")
            .in("id", danceTypeIds);

          const danceTypeMap = new Map<string, string>();
          if (danceTypesData) {
            (danceTypesData as any[]).forEach((dt: any) => {
              danceTypeMap.set(dt.id, dt.name);
            });
          }

          (packages as any[]).forEach((pkg: any) => {
            packageDanceTypeMap.set(pkg.id, {
              id: pkg.dance_type_id,
              name: danceTypeMap.get(pkg.dance_type_id) || "Unknown",
            });
          });
        }
      }
    }

    // Enrich student_packages
    data?.forEach((student: any) => {
      if (student.student_packages) {
        student.student_packages = student.student_packages.map((sp: any) => ({
          ...sp,
          packages: {
            id: sp.package_id,
            dance_type_id: packageDanceTypeMap.get(sp.package_id)?.id,
            dance_type_name: packageDanceTypeMap.get(sp.package_id)?.name,
          },
        }));
      }
    });

    // Add calculated stats
    const studentsWithStats = (data || []).map((student: any) => {
      const totalCredits = (student.student_packages || []).reduce(
        (sum: number, sp: any) => sum + (sp.remaining_credits || 0),
        0
      );
      const activeCourses = (student.course_students || [])
        .map((cs: any) => cs.course)
        .filter(Boolean);
      const branches = (student.course_students || [])
        .map((cs: any) => cs.course?.branch_id)
        .filter(Boolean);
      const courseNames = (student.course_students || [])
        .map((cs: any) => cs.course?.name)
        .filter(Boolean);
      const courseIds = (student.course_students || [])
        .map((cs: any) => cs.course?.id)
        .filter(Boolean);

      return {
        ...student,
        totalRemainingCredits: totalCredits,
        enrolledCoursesCount: activeCourses.length,
        enrolledCourseNames: courseNames,
        enrolledCourseIds: courseIds,
        enrolledCourses: activeCourses,
        branchIds: branches,
        packageDetails: (student.student_packages || []).map((sp: any) => ({
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
    return { error: "An unexpected error occurred", data: [], totalCount: 0 };
  }
}

/**
 * Get filter options for students page
 */
export async function getStudentFilterOptions() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const adminSupabase = createAdminClient();

    // Get dance types list
    const { data: danceTypesData } = await (
      adminSupabase.from("dance_types") as any
    )
      .select("id, name")
      .eq("organization_id", organization.id)
      .order("name");

    const danceTypesList = danceTypesData as any;

    // Get student counts per dance type
    const { data: studentsByDanceType } = await (
      adminSupabase.from("student_packages") as any
    ).select("packages(dance_type_id)", { count: "exact" });

    // Count students per dance type
    const danceTypeCounts: Record<string, number> = {};
    if (studentsByDanceType) {
      danceTypesList?.forEach((dt: any) => {
        const count = (studentsByDanceType as any[]).filter(
          (sp: any) => sp.packages?.dance_type_id === dt.id
        ).length;
        danceTypeCounts[dt.id] = count;
      });
    }

    const danceTypes = ((danceTypesList || []) as any[]).map((dt: any) => ({
      ...dt,
      studentCount: danceTypeCounts[dt.id] || 0,
    }));

    // Get branches list
    const { data: branchesData } = await (adminSupabase.from("branches") as any)
      .select("id, name")
      .eq("organization_id", organization.id)
      .order("name");

    const branchesList = branchesData as any;

    // Get courses list via branches (courses table has no organization_id, only branch_id)
    const { data: coursesData } = await (adminSupabase.from("courses") as any)
      .select("id, name, branch_id, dance_type_id")
      .in("branch_id", (branchesList || [])?.map((b: any) => b.id) || [])
      .order("name");

    const coursesList = coursesData as any;

    // Get student counts per course
    const { data: studentsByCoursData } = await (
      adminSupabase.from("course_students") as any
    ).select("student_id, course_id");

    const studentsByCourse = studentsByCoursData as any;

    // Calculate branch student counts from coursesList and studentsByCourse
    const branchStudentSetsArray: Array<[string, Set<string>]> = [] as Array<
      [string, Set<string>]
    >;
    (coursesList || []).forEach((course: any) => {
      let branchSet = branchStudentSetsArray.find(
        ([id]) => id === course.branch_id
      );
      if (!branchSet) {
        branchSet = [course.branch_id, new Set()];
        branchStudentSetsArray.push(branchSet);
      }
      const courseStudents = (studentsByCourse || [])
        .filter((cs: any) => cs.course_id === course.id)
        .map((cs: any) => cs.student_id)
        .filter(Boolean);

      courseStudents.forEach((studentId: any) => {
        branchSet[1].add(studentId);
      });
    });

    const branchCounts = {} as Record<string, number>;
    branchStudentSetsArray.forEach(([branchId, studentSet]) => {
      branchCounts[branchId] = studentSet.size;
    });

    const branches = ((branchesList || []) as any[]).map((branch: any) => ({
      ...branch,
      studentCount: branchCounts[branch.id] || 0,
    }));

    // Calculate course student counts
    const courseCounts = {} as Record<string, number>;
    (coursesList || []).forEach((course: any) => {
      const uniqueStudents = new Set(
        (studentsByCourse || [])
          .filter((cs: any) => cs.course_id === course.id)
          .map((cs: any) => cs.student_id)
          .filter(Boolean)
      );
      courseCounts[course.id] = uniqueStudents.size;
    });

    const courses = ((coursesList || []) as any[]).map((course: any) => ({
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
      error: "Failed to fetch filter options",
      danceTypes: [],
      branches: [],
      courses: [],
    };
  }
}

export async function getStudentsWithPackages(searchQuery?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

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
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(
        `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching students with packages:", error);
      return { error: "Failed to fetch students" };
    }

    return { data: data as any[] };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function getStudent(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const admin = createAdminClient();
    const { data, error } = await (admin as any)
      .from("students")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single();

    if (error) {
      console.error("Error fetching student:", error);
      return { error: "Student not found" };
    }

    return { data: data as Student };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

interface CreateStudentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}

export async function createStudent(input: CreateStudentInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

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
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating student:", error);
      return { error: "Failed to create student" };
    }

    // Log operation (non-blocking)
    void logOperation(
      "CREATE",
      "student",
      (data as any).id,
      {
        after: {
          firstName: (data as any).first_name,
          lastName: (data as any).last_name,
          email: (data as any).email,
          phone: (data as any).phone,
          notes: (data as any).notes,
        },
      },
      organization.id
    );

    return { data: data as Student, success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  notes?: string | null;
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

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
        error: "Student not found or does not belong to your organization",
      };
    }

    const updateData: StudentUpdate = {};
    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await (supabase.from("students") as any)
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", organization.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating student:", error);
      return { error: "Failed to update student" };
    }

    // Log operation with before/after and changes (non-blocking)
    const beforeObj = {
      firstName: (beforeStudent as any).first_name,
      lastName: (beforeStudent as any).last_name,
      email: (beforeStudent as any).email,
      phone: (beforeStudent as any).phone,
      notes: (beforeStudent as any).notes,
    };
    const afterObj = {
      firstName: (data as any).first_name,
      lastName: (data as any).last_name,
      email: (data as any).email,
      phone: (data as any).phone,
      notes: (data as any).notes,
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
    return { error: "An unexpected error occurred" };
  }
}

export async function deleteStudent(id: string, reason?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

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
        error: "Student not found or does not belong to your organization",
      };
    }

    const user_id = user.id;
    const updateResult = (await (supabase.from("students") as any)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user_id,
        deleted_reason: reason || null,
      })
      .eq("id", id)
      .eq("organization_id", organization.id)) as any;
    const { error } = updateResult;

    if (error) {
      console.error("Error deleting student:", error);
      return { error: "Failed to delete student" };
    }

    // Log operation (non-blocking)
    void logOperation(
      "DELETE",
      "student",
      id,
      {
        before: {
          firstName: (beforeStudent as any).first_name,
          lastName: (beforeStudent as any).last_name,
          email: (beforeStudent as any).email,
          phone: (beforeStudent as any).phone,
          notes: (beforeStudent as any).notes,
        },
      },
      organization.id
    );

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ===========================
// STUDENT PACKAGES & CREDITS
// ===========================

export async function getStudentPackages(studentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const admin = createAdminClient();
    const { data, error } = await (admin as any)
      .from("student_packages")
      .select("*, packages(name, total_credits, price, dance_types(name))")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student packages:", error);
      return { error: "Failed to fetch packages" };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "An unexpected error occurred" };
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
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const supabase = await createServerSupabaseClient();

    // Get student to find their branch
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, organization_id")
      .eq("id", input.studentId)
      .eq("organization_id", organization.id)
      .single();

    if (studentError || !student) {
      return { error: "Student not found" };
    }

    // Get package details
    const { data: packageData, error: packageError } = (await (
      supabase.from("packages") as any
    )
      .select("*")
      .eq("id", input.packageId)
      .eq("organization_id", organization.id)
      .single()) as { data: any; error: any };

    if (packageError || !packageData) {
      return { error: "Package not found" };
    }

    const price = input.price || packageData.price;

    // Create student_packages record
    const { data: studentPackage, error: spError } = await (
      supabase.from("student_packages") as any
    )
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
      return { error: "Failed to create package record" };
    }

    // Get the first branch for this organization to record transaction
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", organization.id)
      .limit(1);

    const branchId =
      branchesData && Array.isArray(branchesData) && branchesData.length > 0
        ? (branchesData[0] as any).id
        : null;

    // Create cash transaction if we have a branch
    if (branchId) {
      const { error: transError } = await (
        supabase.from("cash_transactions") as any
      ).insert({
        branch_id: branchId,
        type: "income",
        amount: price,
        description: `${packageData.name} - Student Purchase`,
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
    return { error: "An unexpected error occurred" };
  }
}

export async function reduceStudentCredits(
  studentPackageId: string,
  amount: number = 1
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const supabase = await createServerSupabaseClient();

    // Get current credits and package name
    const { data: studentPackage, error: fetchError } = await (
      supabase.from("student_packages") as any
    )
      .select(
        "remaining_credits, package:packages(name, total_credits), student_id"
      )
      .eq("id", studentPackageId)
      .single();

    if (fetchError || !studentPackage) {
      return { error: "Package not found" };
    }

    const beforeCredits = studentPackage.remaining_credits;
    const newCredits = Math.max(0, beforeCredits - amount);
    const packageName = studentPackage.package?.name || "Unknown Package";

    // Update credits
    const { data, error } = await (supabase.from("student_packages") as any)
      .update({
        remaining_credits: newCredits,
      })
      .eq("id", studentPackageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credits:", error);
      return { error: "Failed to update credits" };
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
    return { error: "An unexpected error occurred" };
  }
}

export async function increaseStudentCredits(
  studentPackageId: string,
  amount: number = 1
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const supabase = await createServerSupabaseClient();

    // Get current credits and total from packages table
    const { data: studentPackage, error: fetchError } = await (
      supabase.from("student_packages") as any
    )
      .select(
        "id, student_id, remaining_credits, package:packages(total_credits, name)"
      )
      .eq("id", studentPackageId)
      .single();

    if (fetchError || !studentPackage) {
      return { error: "Package not found" };
    }

    const totalCredits = studentPackage.package?.total_credits || 0;
    const beforeCredits = studentPackage.remaining_credits;
    // Don't exceed total credits
    const newCredits = Math.min(totalCredits, beforeCredits + amount);
    const packageName = studentPackage.package?.name || "Unknown Package";

    // Update credits
    const { data, error } = await (supabase.from("student_packages") as any)
      .update({
        remaining_credits: newCredits,
      })
      .eq("id", studentPackageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credits:", error);
      return { error: "Failed to update credits" };
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
    return { error: "An unexpected error occurred" };
  }
}

export async function updateStudentPackageCredits(
  studentPackageId: string,
  newCreditsAmount: number
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const organization = await getOrganization();
  if (!organization) return { error: "No organization found" };

  try {
    const supabase = await createServerSupabaseClient();

    // Get package info with total_credits AND student_id from packages table
    const { data: studentPackage, error: fetchError } = await (
      supabase.from("student_packages") as any
    )
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
      return { error: "Package not found" };
    }

    const totalCredits = studentPackage.package?.total_credits || 0;
    const beforeCredits = studentPackage.remaining_credits;
    const packageName = studentPackage.package?.name || "Unknown Package";

    // Ensure credits don't exceed total or go below 0
    const finalCredits = Math.max(0, Math.min(newCreditsAmount, totalCredits));

    // Update credits
    const { data, error } = await (supabase.from("student_packages") as any)
      .update({
        remaining_credits: finalCredits,
      })
      .eq("id", studentPackageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credits:", error);
      return { error: "Failed to update credits" };
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
    return { error: "An unexpected error occurred" };
  }
}
