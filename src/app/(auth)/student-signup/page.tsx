"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

export default function StudentSignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"verify" | "register">("verify");
  const [studentData, setStudentData] = useState<any>(null);
  const [form, setForm] = useState({
    student_number: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: student, error: findError } = await supabase
      .from("pre_registered_students")
      .select("*")
      .eq("student_number", form.student_number)
      .single();

    if (findError || !student) {
      setError("Student ID not found. Please check with your admin.");
      setLoading(false);
      return;
    }

    if (student.is_registered) {
      setError("This Student ID is already registered. Please login instead.");
      setLoading(false);
      return;
    }

    setStudentData(student);
    setStep("register");
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const fakeEmail = `${form.student_number.toLowerCase()}@student.school.edu`;

    const { data: signupData, error: signupError } =
      await supabase.auth.signUp({
        email: fakeEmail,
        password: form.password,
        options: {
          data: {
            student_number: form.student_number,
            first_name: studentData.first_name,
            last_name: studentData.last_name,
          },
        },
      });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (signupData.user) {
      const userId = signupData.user.id;

      await supabase.from("profiles").upsert(
        {
          id: userId,
          reference_number: form.student_number,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          role: "student",
        },
        { onConflict: "id" }
      );

      await supabase.from("student_profiles").upsert(
        {
          id: userId,
          student_number: form.student_number,
          class_id: studentData.class_id,
          sex: studentData.sex,
        },
        { onConflict: "id" }
      );

      await supabase
        .from("pre_registered_students")
        .update({ is_registered: true })
        .eq("student_number", form.student_number);
    }

    router.push("/student-login?registered=true");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <GraduationCap size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Student Sign Up</h1>
            <p className="text-xs text-gray-500">
              {step === "verify"
                ? "Enter your Student ID to get started"
                : `Welcome, ${studentData?.first_name} ${studentData?.last_name}! Create your password`}
            </p>
          </div>
        </div>

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="student_number"
                value={form.student_number}
                onChange={handleChange}
                required
                placeholder="e.g. STU2024001"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify Student ID"
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/student-login")}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {step === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium">
                ✅ Student ID verified!
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {studentData?.first_name} {studentData?.last_name} —{" "}
                {form.student_number}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Create Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("verify");
                  setError("");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}