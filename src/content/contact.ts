export type ContactLink = {
  label: string;
  url: string;
  newTab: boolean;
};

export const contactInfo = {
  email: "pandeykamal13526@gmail.com",
  github: "https://github.com/justdoGIT",
  linkedin: "https://www.linkedin.com/in/kamalkishorpandey",
};

export const contactLinks: ContactLink[] = [
  {
    label: "Email",
    url: `mailto:${contactInfo.email}`,
    newTab: false,
  },
  {
    label: "GitHub",
    url: contactInfo.github,
    newTab: true,
  },
  {
    label: "LinkedIn",
    url: contactInfo.linkedin,
    newTab: true,
  },
];
