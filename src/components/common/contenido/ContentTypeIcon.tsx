import { useId } from "react";
import type { ContentType } from "@/data/courseContents";

type ContentTypeIconProps = {
  type: ContentType;
  className?: string;
};

export default function ContentTypeIcon({
  type,
  className = "h-9 w-9",
}: ContentTypeIconProps) {
  const reactId = useId();
  const gradientId = `${type}-${reactId.replace(/:/g, "")}`;

  if (type === "pdf") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={className}
        aria-hidden="true"
      >
        <path d="M0 0h24v24H0z" fill="none" />

        <path
          fill="#ef5350"
          d="M13 9h5.5L13 3.5zM6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m4.93 10.44c.41.9.93 1.64 1.53 2.15l.41.32c-.87.16-2.07.44-3.34.93l-.11.04l.5-1.04c.45-.87.78-1.66 1.01-2.4m6.48 3.81c.18-.18.27-.41.28-.66c.03-.2-.02-.39-.12-.55c-.29-.47-1.04-.69-2.28-.69l-1.29.07l-.87-.58c-.63-.52-1.2-1.43-1.6-2.56l.04-.14c.33-1.33.64-2.94-.02-3.6a.85.85 0 0 0-.61-.24h-.24c-.37 0-.7.39-.79.77c-.37 1.33-.15 2.06.22 3.27v.01c-.25.88-.57 1.9-1.08 2.93l-.96 1.8l-.89.49c-1.2.75-1.77 1.59-1.88 2.12c-.04.19-.02.36.05.54l.03.05l.48.31l.44.11c.81 0 1.73-.95 2.97-3.07l.18-.07c1.03-.33 2.31-.56 4.03-.75c1.03.51 2.24.74 3 .74c.44 0 .74-.11.91-.3m-.41-.71l.09.11c-.01.1-.04.11-.09.13h-.04l-.19.02c-.46 0-1.17-.19-1.9-.51c.09-.1.13-.1.23-.1c1.4 0 1.8.25 1.9.35M7.83 17c-.65 1.19-1.24 1.85-1.69 2c.05-.38.5-1.04 1.21-1.69zm3.02-6.91c-.23-.9-.24-1.63-.07-2.05l.07-.12l.15.05c.17.24.19.56.09 1.1l-.03.16l-.16.82z"
        />
      </svg>
    );
  }

  if (type === "video") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className={className}
        aria-hidden="true"
      >
        <path d="M0 0h36v36H0z" fill="none" />

        <path
          fill="currentColor"
          d="M34 10.34a2.11 2.11 0 0 0-1.16-1.9a2 2 0 0 0-2.13.15L26 11.6V8a2 2 0 0 0-2-2H6a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h18a2 2 0 0 0 2-2v-3.6l4.64 3a2.07 2.07 0 0 0 2.2.2A2.11 2.11 0 0 0 34 25.66Zm-2.07 15.43c-.06 0-.11 0-.19-.06L24 20.77V28H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h18v7.23l7.8-5a.11.11 0 0 1 .13 0a.11.11 0 0 1 .07.11v15.32a.11.11 0 0 1-.07.11"
        />

        <path fill="none" d="M0 0h36v36H0z" />
      </svg>
    );
  }

  if (type === "word") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="512"
        height="512"
        viewBox="0 0 512 512"
        className={className}
        aria-hidden="true"
      >
        <path d="M0 0h512v512H0z" fill="none" />

        <linearGradient
          id={gradientId}
          x1="256"
          x2="256"
          y1="14.331"
          y2="497.669"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#285294" />
          <stop offset="1" stopColor="#2c5a9e" />
        </linearGradient>

        <path
          fill={`url(#${gradientId})`}
          d="M491.3 61.6H291.2V14.3L0 62.7v386.7l291.3 48.3v-47.3h200.1c11.4 0 20.7-9.2 20.7-20.6V82.2c-.1-11.5-9.3-20.6-20.8-20.6m4 371.5h-204v-34.6h168.6v-22H291.3v-29.9h168.6v-22H291.3V293h168.6v-22H291.3v-30h168.6v-22H291.3v-29.9h168.6v-22H291.3v-29.9h168.6v-22H291.3V78.6h204z"
        />

        <path
          fill="#fff"
          d="M459.9 398.5v-22H291.3v-29.9h168.6v-22H291.3V293h168.6v-22H291.3v-30h168.6v-22H291.3v-29.9h168.6v-22H291.3v-29.9h168.6v-22H291.3V78.6h204v354.5h-204v-34.6zM78.6 181.8l15.1 96.9c.9 5 1.4 9.3 1.6 12.6c.4-3.8 1-7.4 1.6-9.4l22.4-102.5l29.3-1.7l20.8 104.2c1.4 5.1 1.9 9.4 1.6 12.6c0-3.9.6-8.2 1.6-12.6l18.7-106.8l32.5-1.9L187 334.1l-33.2-2l-20.5-97.4c-.9-4-1.2-6.2-1.6-12.6c-.4 6.3-.7 9.6-1.6 12.6l-20.8 94.8c-10.2-.3-20.3-.9-30.5-1.8L50.4 183.5z"
        />
      </svg>
    );
  }

  if (type === "ppt") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="512"
        height="512"
        viewBox="0 0 512 512"
        className={className}
        aria-hidden="true"
      >
        <path d="M0 0h512v512H0z" fill="none" />

        <linearGradient
          id={gradientId}
          x1="256"
          x2="256"
          y1="490.8"
          y2="25.2"
          gradientTransform="matrix(1 0 0 -1 0 514)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#d04223" />
          <stop offset="1" stopColor="#d44a27" />
        </linearGradient>

        <path
          fill={`url(#${gradientId})`}
          d="M492.1 73.2H280.6v-50L0 69.7v372.5l280.6 46.6v-60.7h211.5c11 0 19.9-8.4 19.9-18.8V92c0-10.4-8.9-18.8-19.9-18.8m3.5 337.9l-214.9.3v-38.6h154.2v-21.2H280.6v-28.8h154.2v-21.2H280.6v-53.1c12.6 15.3 31.7 25.1 53.1 25.1c37.9 0 68.6-30.7 68.6-68.6h-68.6v-68.6c-21.4 0-40.5 9.8-53.1 25.1V89.9h214.9v321.2zM412 196.3h-68.6v-68.6c37.9 0 68.6 30.8 68.6 68.6"
        />

        <path
          fill="#fff"
          d="M280.6 89.9v71.5c12.6-15.3 31.7-25.1 53.1-25.1v68.6h68.6c0 37.9-30.7 68.6-68.6 68.6c-21.4 0-40.5-9.8-53.1-25.1v53.1h154.2v21.2H280.6v28.8h154.2v21.2H280.6v38.6l214.9-.3V89.9zm62.8 106.4v-68.6c37.9 0 68.6 30.7 68.6 68.6zm-163-3.4c-8.1-11.5-16.2-17.5-33.7-16.9l-54 3v156l29.2 1.7v-55.4h22.7c24.9-1.3 41.5-24.4 43.8-51.2c1.1-12.6-1-27.2-8-37.2M137 252.5h-15.2v-47l16-.1c9.9.3 17.2 8.6 17.6 22.5c.6 12.3-7.5 24.2-18.4 24.6"
        />
      </svg>
    );
  }

  return null;
}