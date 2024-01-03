const baseApiUrl = '/api';

export const pages = {
  edit_lti: (id: string) => `/edit-lti/${id}`,
  home: '/home',
};

export const apiPaths = {
  extracts: `${baseApiUrl}/extracts`,
};
