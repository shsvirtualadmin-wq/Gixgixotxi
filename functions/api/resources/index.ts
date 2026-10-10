import { createClient } from "../../_utils/supabaseStub.js";

interface PagesContext {
  request: Request;
  env: Record<string, any>;
}

function getSupabaseClient(env: Record<string, any>) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://wbvzbbnapowwmrjecdyt.supabase.co";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const ADMIN_EMAILS = [
  "shsvirtualadmin@gmail.com",
  "dj.khadijajameel19@gmail.com",
  "syedrayyanf1@gmail.com",
  "shs.academy.virtual@gmail.com",
];

function parseAssignedClasses(record: any): string[] {
  const allowed = new Set<string>();
  if (!record) return [];

  let assignedArr: string[] = [];
  if (Array.isArray(record.assigned_classes)) {
    assignedArr = record.assigned_classes;
  } else if (typeof record.assigned_classes === "string" && record.assigned_classes.trim()) {
    try {
      const parsed = JSON.parse(record.assigned_classes);
      assignedArr = Array.isArray(parsed) ? parsed : [record.assigned_classes];
    } catch {
      assignedArr = [record.assigned_classes];
    }
  }

  assignedArr.forEach((c) => {
    const cStr = String(c).trim().toUpperCase();
    if (cStr.includes("MDCAT")) allowed.add("MDCAT");
    else if (cStr.includes("TCAT") || cStr.includes("UET") || cStr.includes("ECAT")) allowed.add("TCAT");
    else if (cStr.includes("9") || cStr.includes("NINTH")) allowed.add("Class 9");
    else if (cStr.includes("10") || cStr.includes("TENTH") || cStr.includes("MATRIC")) allowed.add("Class 10");
    else if (cStr.includes("11") || cStr.includes("FIRST") || cStr.includes("FSC 1")) allowed.add("Class 11");
    else if (cStr.includes("12") || cStr.includes("SECOND") || cStr.includes("FSC 2")) allowed.add("Class 12");
  });

  const gStr = String(record.grade || "").trim().toUpperCase();
  const sStr = String(record.stream || "").trim().toUpperCase();
  const pStr = String(record.package_name || "").trim().toUpperCase();
  const combined = `${gStr} ${sStr} ${pStr}`;

  if (combined.includes("MDCAT")) allowed.add("MDCAT");
  if (combined.includes("TCAT") || combined.includes("UET") || combined.includes("ECAT")) allowed.add("TCAT");
  if (gStr.includes("9") || gStr.includes("NINTH") || combined.includes("CLASS 9") || combined.includes("GRADE 9")) allowed.add("Class 9");
  if (gStr.includes("10") || gStr.includes("TENTH") || combined.includes("CLASS 10") || combined.includes("GRADE 10")) allowed.add("Class 10");
  if (gStr.includes("11") || gStr.includes("FIRST YEAR") || gStr.includes("FSC 1") || combined.includes("CLASS 11") || combined.includes("GRADE 11")) allowed.add("Class 11");
  if (gStr.includes("12") || gStr.includes("SECOND YEAR") || gStr.includes("FSC 2") || combined.includes("CLASS 12") || combined.includes("GRADE 12")) allowed.add("Class 12");

  if (allowed.size === 0) {
    if (gStr.includes("9")) allowed.add("Class 9");
    else if (gStr.includes("10")) allowed.add("Class 10");
    else if (gStr.includes("11")) allowed.add("Class 11");
    else if (gStr.includes("12")) allowed.add("Class 12");
  }

  return Array.from(allowed);
}

export const onRequestGet = async (context: PagesContext) => {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const classFilter = url.searchParams.get("class");
    const studentEmail = (url.searchParams.get("studentEmail") || "").trim().toLowerCase();
    const queryGrade = (url.searchParams.get("grade") || "").trim();
    const queryStream = (url.searchParams.get("stream") || "").trim();

    const db = getSupabaseClient(env);
    if (!db) {
      return new Response(
        JSON.stringify({ success: true, resources: [] }),
        { status: 200, headers: corsHeaders }
      );
    }

    const isAdmin = Boolean(studentEmail && ADMIN_EMAILS.includes(studentEmail));

    let allowedClasses: string[] | null = null;
    if (!isAdmin) {
      let studentRecord: any = null;
      if (studentEmail) {
        try {
          const { data: sData } = await db
            .from("students")
            .select("grade, stream, assigned_classes, package_name, subscribed_plans")
            .eq("email", studentEmail)
            .maybeSingle();
          studentRecord = sData;
        } catch (stErr) {
          console.warn("Student lookup in Pages functions warning:", stErr);
        }
      }
      if (!studentRecord && (queryGrade || queryStream)) {
        studentRecord = { grade: queryGrade, stream: queryStream };
      }
      if (studentRecord) {
        allowedClasses = parseAssignedClasses(studentRecord);
      }
    }

    let query = db.from("resources").select("*").order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (!isAdmin && allowedClasses && allowedClasses.length > 0) {
      if (classFilter && classFilter !== "All" && classFilter !== "all" && classFilter !== "All Classes" && classFilter !== "All My Classes") {
        const isMatch = allowedClasses.some(ac => ac.toLowerCase() === classFilter.toLowerCase());
        if (!isMatch) {
          return new Response(
            JSON.stringify({ success: false, error: `Access Denied: You are not assigned to ${classFilter}.`, resources: [] }),
            { status: 403, headers: corsHeaders }
          );
        }
        query = query.eq("class", classFilter);
      } else {
        const filterClasses = [...allowedClasses, "All", "all", "All Classes", "General"];
        query = query.in("class", filterClasses);
      }
    } else if (classFilter && classFilter !== "All" && classFilter !== "all" && classFilter !== "All Classes" && classFilter !== "All My Classes") {
      query = query.eq("class", classFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase resources fetch error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message, resources: [] }),
        { status: 200, headers: corsHeaders }
      );
    }

    let filteredData = data || [];
    if (!isAdmin && allowedClasses && allowedClasses.length > 0) {
      filteredData = filteredData.filter((item: any) => {
        const itemClass = (item.class || "").trim();
        if (itemClass.toLowerCase() === "all" || itemClass.toLowerCase() === "all classes" || itemClass.toLowerCase() === "general") {
          return true;
        }
        return allowedClasses!.some(ac => ac.toLowerCase() === itemClass.toLowerCase() || itemClass.toLowerCase().includes(ac.toLowerCase()));
      });
    }

    return new Response(
      JSON.stringify({ success: true, resources: filteredData }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Error in /api/resources:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to fetch resources", resources: [] }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
