export type NavUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function toNavUser(user: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null | undefined): NavUser | null {
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

export function getNavUserDisplayName(user: NavUser | null | undefined) {
  if (user?.name?.trim()) {
    return user.name.trim();
  }
  if (user?.email) {
    return user.email.split("@")[0] ?? user.email;
  }
  return "Account";
}

export function getNavUserInitials(user: NavUser | null | undefined) {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email[0].toUpperCase();
  }
  return "?";
}
