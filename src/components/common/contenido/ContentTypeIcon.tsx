import { useId } from "react";
import type { ContentType } from "@/data/courseContents";

type ContentTypeIconProps = {
  type: ContentType | "file" | "excel" | "zip" | "rar";
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
  } else if (type === "video") {
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
  } else if (type === "word") {
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
  } else if (type === "ppt") {
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
  } else if (type === "excel") {
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
        <path
          fill="#e8f5e9"
          d="M224 24h176l64 64v376H224z"
        />
        <path fill="#c8e6c9" d="M400 24v64h64z" />
        <path fill="#107c41" d="M48 112h280v288H48z" />
        <path fill="#21a366" d="M328 112h56v288h-56z" />
        <path
          fill="#fff"
          d="M95 177h35l30 54 30-54h35l-48 78 51 80h-36l-33-56-32 56H91l51-80z"
        />
        <path
          fill="none"
          stroke="#107c41"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M355 160h70M355 220h70M355 280h70M355 340h70"
        />
      </svg>
    );
  } else if (type === "image") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0 0h24v24H0z"
          fill="none"
        />

        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <path d="M2 6a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />

          <circle
            cx="8.5"
            cy="8.5"
            r="2.5"
          />

          <path d="M14.526 12.621L6 22h12.133A3.867 3.867 0 0 0 22 18.133V18c0-.466-.175-.645-.49-.99l-4.03-4.395a2 2 0 0 0-2.954.006" />
        </g>
      </svg>
    );
  } else if (type === "zip") {
    // Carpeta comprimida con cremallera, inspirada en los iconos clásicos de ZIP.
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${gradientId}-zip-back`} x1="4" y1="6" x2="31" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFE58A" />
            <stop offset="1" stopColor="#E8A92B" />
          </linearGradient>
          <linearGradient id={`${gradientId}-zip-front`} x1="6" y1="13" x2="30" y2="31" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFD85D" />
            <stop offset="1" stopColor="#E99A20" />
          </linearGradient>
        </defs>
        <path
          d="M3.5 11.2A3.2 3.2 0 0 1 6.7 8h7.1l3.1 3h12.4a3.2 3.2 0 0 1 3.2 3.2v1.1H3.5z"
          fill={`url(#${gradientId}-zip-back)`}
          stroke="#B7791F"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 13.2h29l-2.7 16.1a2.8 2.8 0 0 1-2.8 2.3H6.7a2.8 2.8 0 0 1-2.8-3.2z"
          fill={`url(#${gradientId}-zip-front)`}
          stroke="#B7791F"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M15.5 12.9h5v14.4h-5z" fill="#8B6842" opacity=".95" />
        <path d="M16.5 13.3h3v13.5h-3z" fill="#5D4935" />
        <g fill="#F8E6B7">
          <path d="M16.2 14h1.8v1.55h-1.8zM18.2 15.7H20v1.55h-1.8zM16.2 17.4H18v1.55h-1.8zM18.2 19.1H20v1.55h-1.8zM16.2 20.8H18v1.55h-1.8zM18.2 22.5H20v1.55h-1.8zM16.2 24.2H18v1.55h-1.8z" />
        </g>
        <path d="M18.4 26.3h2.2v2.3l1.5 1.3-1.4 1.4-2.3-2.1z" fill="#6B4B2B" stroke="#F4D17A" strokeWidth=".65" strokeLinejoin="round" />
        <path d="M6.1 15.3h7.2" stroke="#FFF0B8" strokeWidth="1" strokeLinecap="round" opacity=".7" />
      </svg>
    );
  } else if (type === "rar") {
    // Tres libros apilados con una correa y hebilla, inspirados en los iconos clásicos de RAR.
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${gradientId}-rar-red`} x1="5" y1="4" x2="31" y2="13" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E96B65" />
            <stop offset="1" stopColor="#A9232F" />
          </linearGradient>
          <linearGradient id={`${gradientId}-rar-blue`} x1="6" y1="12" x2="30" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#67B7E8" />
            <stop offset="1" stopColor="#2365A5" />
          </linearGradient>
          <linearGradient id={`${gradientId}-rar-green`} x1="4" y1="19" x2="30" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8ECF6F" />
            <stop offset="1" stopColor="#347C43" />
          </linearGradient>
        </defs>
        {/* Libro superior */}
        <path d="M8 4.8h20.1a2 2 0 0 1 2 2v5.8H8a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2z" fill={`url(#${gradientId}-rar-red)`} stroke="#7C252B" strokeWidth="1" strokeLinejoin="round" />
        <path d="M9.4 6.2v4.8M11.1 6.2v4.8" stroke="#FFD1C6" strokeWidth=".7" opacity=".8" />
        <path d="M27.2 6.2h1.2v4.8h-1.2z" fill="#F9D7C9" opacity=".9" />
        {/* Libro central */}
        <path d="M6.8 12.2h21.4a2 2 0 0 1 2 2v5.6H6.8a2 2 0 0 1-2-2v-3.6a2 2 0 0 1 2-2z" fill={`url(#${gradientId}-rar-blue)`} stroke="#204E7B" strokeWidth="1" strokeLinejoin="round" />
        <path d="M8.2 13.5v4.8M9.9 13.5v4.8" stroke="#D3ECFF" strokeWidth=".7" opacity=".85" />
        <path d="M27.2 13.5h1.2v4.8h-1.2z" fill="#D9ECF9" opacity=".9" />
        {/* Libro inferior */}
        <path d="M5.7 19.2h22.6a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H5.7a2 2 0 0 1-2-2v-3.5a2 2 0 0 1 2-2z" fill={`url(#${gradientId}-rar-green)`} stroke="#285F35" strokeWidth="1" strokeLinejoin="round" />
        <path d="M7.1 20.6v4.8M8.8 20.6v4.8" stroke="#E0F5D0" strokeWidth=".7" opacity=".85" />
        <path d="M27.2 20.5h1.2v4.9h-1.2z" fill="#D5EFC7" opacity=".9" />
        {/* Correa vertical y hebilla */}
        <path d="M16.2 4.4h4.1v25.1h-4.1z" fill="#9A6738" stroke="#5D3E25" strokeWidth=".8" />
        <path d="M17 4.8h1v24.3h-1z" fill="#E5B66F" opacity=".8" />
        <rect x="15.1" y="14.5" width="6.3" height="6.3" rx=".8" fill="#E2B34F" stroke="#68451F" strokeWidth="1" />
        <rect x="16.8" y="16.1" width="2.9" height="3.1" rx=".3" fill="#60452C" stroke="#F7D88B" strokeWidth=".65" />
        <path d="M14.9 15.5h.8v4.4h-.8M20.8 15.5h.8v4.4h-.8" fill="none" stroke="#F9D78D" strokeWidth=".6" />
      </svg>
    );
  } else if (type === "file") {
    return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
    );
  }

  return null;
}