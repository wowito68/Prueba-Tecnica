import type { SVGProps } from "react";

type IconName =
  | "book"
  | "library"
  | "logout"
  | "menu"
  | "close"
  | "eye"
  | "eye-off";
const paths: Record<IconName, React.ReactNode> = {
  book: (
    <>
      <path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" />
      <path d="M12 5v15M5 8h4M15 8h4" />
    </>
  ),
  library: <path d="M3 3h4v18H3zM9 3h4v18H9zM15 4l4-1 4 17-4 1z" />,
  logout: <path d="M10 4H4v16h6M13 12h9m-4-4 4 4-4 4" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <path d="m3 3 18 18M10 5a13 13 0 0 1 2 0c7 0 10 7 10 7a17 17 0 0 1-3 4M6 6a19 19 0 0 0-4 6s3 7 10 7a12 12 0 0 0 5-1" />
  ),
};

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
