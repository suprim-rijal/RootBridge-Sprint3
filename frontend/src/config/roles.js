export const ROLES = Object.freeze({
  CHILD_PARENT: "CombinedChildParent",
  NORMAL: "NormalUser",
  TEACHER: "Teacher",
});

// Order and wording of the role menu.
export const ROLE_OPTIONS = Object.freeze([
  { value: ROLES.CHILD_PARENT, label: "Child/Parent" },
  { value: ROLES.NORMAL, label: "Normal" },
  { value: ROLES.TEACHER, label: "Teacher" },
]);

export const ROLE_LABELS = Object.freeze(
  Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label])),
);

// Roles that use the dashboard and the learning paths.
export const LEARNER_ROLES = Object.freeze([ROLES.CHILD_PARENT, ROLES.NORMAL]);

// The two views inside a Child/Parent account.
export const VIEWS = Object.freeze({ CHILD: "child", PARENT: "parent" });

// Home page for a role (and, for families, for the current view).
export function homeFor(role, view = VIEWS.CHILD) {
  if (role === ROLES.CHILD_PARENT)
    return view === VIEWS.PARENT ? "/parent" : "/dashboard";
  if (role === ROLES.NORMAL) return "/dashboard";
  if (role === ROLES.TEACHER) return "/teacher";
  return "/";
}

export const isKnownRole = (role) => Object.values(ROLES).includes(role);
