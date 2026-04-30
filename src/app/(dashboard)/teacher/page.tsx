"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Users,
  Calendar,
  Award,
  BarChart2,
  ClipboardList,
  User,
} from "lucide-react";

interface TeacherProfile {
  first_name: string;
  last_name: string;
  teacher_number: string;
}

interface AssignedSubject {
  id: string;
  name: string;
  class_id: string | null;
  classes?: { name: string } | null;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentTerm = "First Term";
  const academicYear = new Date().getFullYear();

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/teacher-login");
      return;
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    // Get teacher_profile
    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("teacher_number")
      .eq("id", user.id)
      .single();

    if (!profile || !teacherProfile) {
      console.error("Profile or teacher profile not found");
      setLoading(false);
      return;
    }

    setTeacher({
      first_name: profile.first_name,
      last_name: profile.last_name,
      teacher_number: teacherProfile.teacher_number,
    });

    // Get pre_registered_teachers record
    const { data: preTeacher } = await supabase
      .from("pre_registered_teachers")
      .select("id")
      .eq("teacher_number", teacherProfile.teacher_number)
      .single();

    if (!preTeacher) {
      console.error("Pre registered teacher not found");
      setLoading(false);
      return;
    }

    // Get assigned subjects
    const { data: teacherSubjects } = await supabase
      .from("teacher_subjects")
      .select(
        `
      subjects (
        id,
        name,
        class_id,
        classes ( name )
      )
    `,
      )
      .eq("teacher_id", preTeacher.id);

    if (teacherSubjects) {
      const formatted = teacherSubjects
        .map((ts: any) => ts.subjects)
        .filter(Boolean);
      setSubjects(formatted);

      const classIds = [
        ...new Set(
          formatted.filter((s: any) => s?.class_id).map((s: any) => s.class_id),
        ),
      ];

      if (classIds.length > 0) {
        const { count } = await supabase
          .from("pre_registered_students")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds);

        setTotalStudents(count || 0);
      }
    }

    setLoading(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );

  return (
    <div className="flex-1 p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart2 size={22} className="text-green-600" />
          Teacher Dashboard
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
          <span>Welcome,</span>
          <span className="font-semibold text-green-600">
            {teacher?.first_name} {teacher?.last_name}
          </span>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="bg-linear-to-r from-blue-700 to-blue-500 rounded-2xl p-5 mb-6 text-white flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">
            {getGreeting()}, {teacher?.first_name} {teacher?.last_name}!
          </h3>
          <p className="text-blue-100 text-sm mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(currentTime)}
            </span>
            <span>🕐 {formatTime(currentTime)}</span>
          </p>
        </div>
        <span className="bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/30">
          TEACHER
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Subjects Assigned",
            value: subjects.length,
            Icon: BookOpen,
            color: "bg-blue-500",
          },
          {
            label: "Total Students",
            value: totalStudents,
            Icon: Users,
            color: "bg-green-500",
          },
          {
            label: "Current Term",
            value: currentTerm,
            Icon: Award,
            color: "bg-orange-500",
          },
          {
            label: "Academic Year",
            value: academicYear,
            Icon: Calendar,
            color: "bg-purple-500",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
            <div
              className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}
            >
              <card.Icon size={20} color="white" />
            </div>
          </div>
        ))}
      </div>

      {/* Profile and Quick Tip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* My Profile */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-5 py-3 flex items-center gap-2">
            <User size={16} className="text-white" />
            <h3 className="font-semibold text-white text-sm">My Profile</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                {teacher?.first_name?.[0]}
                {teacher?.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {teacher?.first_name} {teacher?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {teacher?.teacher_number}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                {
                  label: "Name",
                  value: `${teacher?.first_name} ${teacher?.last_name}`,
                },
                { label: "Teacher ID", value: teacher?.teacher_number },
                {
                  label: "Subjects Assigned",
                  value: `${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between py-1.5 border-b border-gray-100"
                >
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Tip */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-yellow-500 px-5 py-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-white" />
            <h3 className="font-semibold text-white text-sm">Quick Tip</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                📌 Note: You can only enter results for subjects assigned to
                you.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                📌 Use "Enter Results" to upload student scores for your
                subjects.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                📌 Use "Take Attendance" to mark daily student attendance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Subjects Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-orange-500 px-5 py-3 flex items-center gap-2">
          <BookOpen size={16} className="text-white" />
          <h3 className="font-semibold text-white text-sm">
            My Assigned Subjects (By Class)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Class</th>
                <th className="px-5 py-3 text-left">Subject</th>
                <th className="px-5 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    No subjects assigned yet. Contact your admin.
                  </td>
                </tr>
              ) : (
                subjects.map((subject, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-600">
                      {(subject.classes as any)?.name || (
                        <span className="text-gray-400 italic">
                          All classes
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {subject.name}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => router.push("/teacher/results")}
                        className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                      >
                        Enter Results
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
