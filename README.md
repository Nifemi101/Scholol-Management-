#  Apex School Management System

A full-stack web application for managing school operations including student enrollment, teacher management, subject assignment, results, and more. Built with NextJS and Tailwind and deployed on Vercel.

**Live Demo:** [https://apex-int.vercel.app](https://apex-int.vercel.app)


## Overview

The Apex School Management System is a role-based platform designed to streamline school administration. It provides three separate portals for **Admins**, **Teachers**, and **Students**, each with tailored functionality and access control.

The system is built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase** for the backend, authentication, and database.

### Security
- Role-based access control (Admin, Teacher, Student)
- Row Level Security (RLS) on all database tables
- Route protection via Next.js middleware
- Automatic role-based redirect on login
- Session-based authentication via Supabase Auth

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [Supabase](https://supabase.com) | Database, Auth, and Storage |
| [Lucide React](https://lucide.dev) | Icon library |
| [Vercel](https://vercel.com) | Deployment and hosting |


### 1. Clone the Repository

```bash
git clone https://github.com/your-username/school-management.git
cd school-management
```

### 2. Install Dependencies

```bash
npm install
```



##  Authentication Flow
### Admin
```
Admin created manually in Supabase Auth
        ↓
Profile inserted manually with role = 'admin'
        ↓
Logs in at /admin-login with email + password
        ↓
Role verified → redirected to /admin
```

### Teacher
```
Admin adds teacher to pre_registered_teachers
        ↓
Teacher visits /teacher-signup
        ↓
Enters Teacher ID → system verifies ID exists
        ↓
Teacher creates password
        ↓
Account created, profile auto-generated
        ↓
Logs in at /teacher-login with Teacher ID + password
```

### Student
```
Admin adds student to pre_registered_students
        ↓
Student visits /student-signup
        ↓
Enters Student ID → system verifies ID exists
        ↓
Student creates password
        ↓
Account created, profile auto-generated
        ↓
Logs in at /student-login with Student ID + password
```

> **Note:** Supabase Auth requires an email address. Teacher and student accounts use a generated email in the format `id@role.school.edu` (e.g., `stu001@student.school.edu`). Users never see or use this email.

### In Progress
- [ ] Teacher — Enter student results
- [ ] Teacher — Upload study materials
- [ ] Teacher — Take attendance
- [ ] Student — Select and view enrolled subjects
- [ ] Student — View full results by term
- [ ] Student — Access study materials
- [ ] Student — Update guardian information

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request


> Built with Next.js, TypeScript, Tailwind CSS, and Supabase