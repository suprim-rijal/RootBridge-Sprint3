// User roles (same values as frontend/src/config/roles.js).
// Sprint 3: the Admin role was removed.
const ROLES = Object.freeze({
  CHILD_PARENT: "CombinedChildParent", // one family account: child view + parent view
  NORMAL: "NormalUser", // independent learner (the only role with lives)
  TEACHER: "Teacher",
});

const ROLE_LABELS = Object.freeze({
  [ROLES.CHILD_PARENT]: "Child/Parent",
  [ROLES.NORMAL]: "Normal",
  [ROLES.TEACHER]: "Teacher",
});

const LEARNER_ROLES = Object.freeze([ROLES.CHILD_PARENT, ROLES.NORMAL]);

const isKnownRole = (role) => Object.values(ROLES).includes(role);

module.exports = { ROLES, ROLE_LABELS, LEARNER_ROLES, isKnownRole };
