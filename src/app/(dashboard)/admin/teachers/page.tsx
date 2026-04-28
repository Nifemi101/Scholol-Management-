"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Trash2,
  PlusSquare,
  ArrowLeft,
  School,
  Filter,
  BookOpen,
  X,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

interface Teacher {
  id: string;
  teacher_number: string;
  first_name: string;
  last_name: string;
  is_registered: boolean;
  subjects?: { id: string; name: string }[];
}

interface Subject {
  id: string;
  name: string;
}

function ConfirmModal({
  teacherNumber,
  onConfirm,
  onCancel,
}: {
  teacherNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Delete Teacher</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Are you sure you want to delete teacher:
        </p>
        <p className="text-sm font-semibold text-gray-800 mb-4">
          {teacherNumber}
        </p>
        <p className="text-xs text-red-500 mb-6">
          ⚠️ This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignSubjectModal({
  teacher,
  allSubjects,
  onClose,
  onSave,
}: {
  teacher: Teacher;
  allSubjects: Subject[];
  onClose: () => void;
  onSave: (teacherId: string, subjectIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(
    teacher.subjects?.map((s) => s.id) || [],
  );
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(teacher.id, selected);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Assign Subjects</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {teacher.first_name} {teacher.last_name} ({teacher.teacher_number}
              )
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {allSubjects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No subjects available. Add subjects first.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
            {allSubjects.map((subject) => (
              <label
                key={subject.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(subject.id)}
                  onChange={() => toggle(subject.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{subject.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Subjects"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmTeacher, setConfirmTeacher] = useState<{
    id: string;
    teacher_number: string;
  } | null>(null);
  const [assigningTeacher, setAssigningTeacher] = useState<Teacher | null>(
    null,
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: teachersData } = await supabase
      .from("pre_registered_teachers")
      .select("id, teacher_number, first_name, last_name, is_registered")
      .order("created_at", { ascending: false });

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");

    const { data: teacherSubjectsData } = await supabase
      .from("teacher_subjects")
      .select("teacher_id, subjects(id, name)");

    if (teachersData) {
      const enriched = teachersData.map((t: any) => ({
        ...t,
        subjects:
          teacherSubjectsData
            ?.filter((ts: any) => ts.teacher_id === t.id)
            .map((ts: any) => ts.subjects) || [],
      }));
      setTeachers(enriched);
    }

    if (subjectsData) setSubjects(subjectsData);
    setLoading(false);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmTeacher) return;
    const { id, teacher_number } = confirmTeacher;
    setDeleting(id);
    setConfirmTeacher(null);

    await supabase
      .from("teacher_profiles")
      .delete()
      .eq("teacher_number", teacher_number);
    await supabase.from("teacher_subjects").delete().eq("teacher_id", id);
    const { error } = await supabase
      .from("pre_registered_teachers")
      .delete()
      .eq("id", id);

    if (!error) setTeachers((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  };

  const handleSaveSubjects = async (
    teacherId: string,
    subjectIds: string[],
  ) => {
    // Delete existing assignments
    await supabase
      .from("teacher_subjects")
      .delete()
      .eq("teacher_id", teacherId);

    // Insert new assignments
    if (subjectIds.length > 0) {
      await supabase
        .from("teacher_subjects")
        .insert(
          subjectIds.map((subject_id) => ({
            teacher_id: teacherId,
            subject_id,
          })),
        );
    }

    // Refresh data
    await fetchData();
  };

  const filtered = teachers.filter(
    (t) =>
      t.teacher_number.toLowerCase().includes(search.toLowerCase()) ||
      `${t.first_name} ${t.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading teachers...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {confirmTeacher && (
        <ConfirmModal
          teacherNumber={confirmTeacher.teacher_number}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmTeacher(null)}
        />
      )}

      {assigningTeacher && (
        <AssignSubjectModal
          teacher={assigningTeacher}
          allSubjects={subjects}
          onClose={() => setAssigningTeacher(null)}
          onSave={handleSaveSubjects}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <School size={22} className="text-blue-600" />
              Teachers
            </h1>
            <p className="text-xs text-gray-500">
              {teachers.length} total teachers
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/add-teacher")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusSquare size={16} />
          Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by teacher ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Teacher ID</th>
                <th className="px-5 py-3 text-left">Full Name</th>
                <th className="px-5 py-3 text-left">Assigned Subjects</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    {search
                      ? "No teachers match your search."
                      : 'No teachers added yet. Click "Add Teacher" to get started.'}
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono font-medium text-blue-600">
                      {teacher.teacher_number}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {teacher.first_name} {teacher.last_name}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.map((s) => (
                            <span
                              key={s.id}
                              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
                            >
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            No subjects assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {teacher.is_registered ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          Registered
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAssigningTeacher(teacher)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <BookOpen size={12} />
                          Assign Subjects
                        </button>
                        <button
                          onClick={() =>
                            setConfirmTeacher({
                              id: teacher.id,
                              teacher_number: teacher.teacher_number,
                            })
                          }
                          disabled={deleting === teacher.id}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
