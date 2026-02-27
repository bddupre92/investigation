import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { Separator } from "@/components/ui/separator"
import { createUser } from "@/actions/admin"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  REVIEWER: "bg-blue-100 text-blue-800",
  INVESTIGATOR: "bg-slate-100 text-slate-700",
  VIEWER: "bg-gray-100 text-gray-600",
}

interface UserRow {
  id: string
  name: string
  email: string
  department: string | null
  role: string
  active: boolean
  createdAt: Date
}

async function handleCreateUser(formData: FormData) {
  "use server"
  await createUser(formData)
}

export default async function AdminUsersPage() {
  await requireAdmin()

  const users = (await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })) as UserRow[]

  return (
    <div className="p-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage user accounts, roles, and access levels.
        </p>
      </div>

      <Separator className="mb-8" />

      {/* Users table */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          All Users ({users.length})
        </h2>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map((user: UserRow) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.department ?? (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {user.createdAt.toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    })}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Create user form */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Create New User
        </h2>

        <form
          action={handleCreateUser}
          className="rounded-lg border border-slate-200 bg-white p-6 space-y-5 max-w-xl"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Jane Smith"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@company.com"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-slate-700"
            >
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue="INVESTIGATOR"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="VIEWER">Viewer</option>
              <option value="INVESTIGATOR">Investigator</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label
              htmlFor="department"
              className="block text-sm font-medium text-slate-700"
            >
              Department{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="department"
              name="department"
              type="text"
              placeholder="e.g. Quality Assurance"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Create User
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
