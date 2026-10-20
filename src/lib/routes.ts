// Static export (GitHub Pages) cannot pre-render runtime ids, so ids travel in the query string.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const splitPath = (slug: string) => `/r?slug=${encodeURIComponent(slug)}`;

export const splitAdminPath = (slug: string, token?: string | null) => {
  const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
  return `/r/admin?slug=${encodeURIComponent(slug)}${tokenQuery}`;
};

export const groupPath = (id: string) => `/despesas/group?id=${encodeURIComponent(id)}`;

/** Link that connects a new device to your member: invite token and one-time code both ride in the hash. */
export const deviceLinkPath = (groupId: string, inviteToken: string, code: string) =>
  `${groupPath(groupId)}#t=${encodeURIComponent(inviteToken)}&link=${encodeURIComponent(code)}`;

/** Absolute URL for sharing; `path` is an app route from the helpers above. */
export const absoluteUrl = (path: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}${BASE_PATH}${path}`;
