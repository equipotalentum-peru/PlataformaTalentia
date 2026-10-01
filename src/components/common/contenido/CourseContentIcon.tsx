"use client";

import type { ContentType } from "@/data/courseContents";

type CourseContentIconProps = {
  type: ContentType;
  className?: string;
};

export default function CourseContentIcon({
  type,
  className = "h-5 w-5",
}: CourseContentIconProps) {

  // PDF
  if (type === "pdf") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h56v56H0z" fill="none" />

        <path
          fill="currentColor"
          d="M15.555 53.125h24.89c4.852 0 7.266-2.461 7.266-7.336V24.508c0-3.024-.328-4.336-2.203-6.258L32.57 5.102c-1.78-1.829-3.234-2.227-5.882-2.227H15.555c-4.828 0-7.266 2.484-7.266 7.36v35.554c0 4.898 2.438 7.336 7.266 7.336m.187-3.773c-2.414 0-3.68-1.29-3.68-3.633V10.305c0-2.32 1.266-3.657 3.704-3.657h10.406v13.618c0 2.953 1.5 4.406 4.406 4.406h13.36v21.047c0 2.343-1.243 3.633-3.68 3.633ZM31 21.132c-.914 0-1.29-.374-1.29-1.312V7.375l13.5 13.758Zm5.625 9.985h-17.79c-.843 0-1.452.633-1.452 1.43c0 .82.61 1.453 1.453 1.453h17.789a1.43 1.43 0 0 0 1.453-1.453c0-.797-.633-1.43-1.453-1.43m0 8.18h-17.79c-.843 0-1.452.656-1.452 1.476c0 .797.61 1.407 1.453 1.407h17.789c.82 0 1.453-.61 1.453-1.407c0-.82-.633-1.476-1.453-1.476"
        />
      </svg>
    );
  }

  // WORD
  if (type === "word") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="56"
        height="56"
        viewBox="0 0 56 56"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h56v56H0z" fill="none" />

        <path
          fill="currentColor"
          d="M15.555 53.125h24.89c4.852 0 7.266-2.461 7.266-7.336V24.508c0-3.024-.328-4.336-2.203-6.258L32.57 5.102c-1.78-1.829-3.234-2.227-5.882-2.227H15.555c-4.828 0-7.266 2.484-7.266 7.36v35.554c0 4.898 2.438 7.336 7.266 7.336m.187-3.773c-2.414 0-3.68-1.29-3.68-3.633V10.305c0-2.32 1.266-3.657 3.704-3.657h10.406v13.618c0 2.953 1.5 4.406 4.406 4.406h13.36v21.047c0 2.343-1.243 3.633-3.68 3.633ZM31 21.132c-.914 0-1.29-.374-1.29-1.312V7.375l13.5 13.758Zm5.625 9.985h-17.79c-.843 0-1.452.633-1.452 1.43c0 .82.61 1.453 1.453 1.453h17.789a1.43 1.43 0 0 0 1.453-1.453c0-.797-.633-1.43-1.453-1.43m0 8.18h-17.79c-.843 0-1.452.656-1.452 1.476c0 .797.61 1.407 1.453 1.407h17.789c.82 0 1.453-.61 1.453-1.407c0-.82-.633-1.476-1.453-1.476"
        />
      </svg>
    );
  }

  // VIDEO
  if (type === "video") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h24v24H0z" fill="none" />

        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        >
          <rect
            width="20"
            height="16"
            x="2"
            y="4"
            rx="4"
          />

          <path d="m15 12l-5-3v6z" />
        </g>
      </svg>
    );
  }

  // PPT
  if (type === "ppt") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h48v48H0z" fill="none" />

        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        >
          <path d="M4 8h40" />
          <path d="M8 8h32v26H8z" clipRule="evenodd" />
          <path d="m22 16l5 5l-5 5m-6 16l8-8l8 8" />
        </g>
      </svg>
    );
  }

  // LINK
  if (type === "link") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="512"
        height="512"
        viewBox="0 0 512 512"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h512v512H0z" fill="none" />

        <path
          fill="currentColor"
          d="M48 256a80.09 80.09 0 0 1 80-80h112v-32H128a112 112 0 0 0 0 224h112v-32H128a80.09 80.09 0 0 1-80-80m336-112H272v32h112a80 80 0 0 1 0 160H272v32h112a112 112 0 0 0 0-224"
        />

        <path
          fill="currentColor"
          d="M140 240.652h232v32H140z"
        />
      </svg>
    );
  }

  // ACTIVIDAD
  if (type === "activity") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h32v32H0z" fill="none" />

        <path
          fill="currentColor"
          d="M25 5h-3V4c0-1.1-.9-2-2-2h-8c-1.1 0-2 .9-2 2v1H7c-1.1 0-2 .9-2 2v21c0 1.1-.9 2 2 2h5v-2H7V7h3v3h12V7h3v6h2V7c0-1.1-.9-2-2-2m-5 3h-8V4h8zm9.71 11.29l-3-3c-.39-.39-1.03-.39-1.42 0l-3 3l-6.29 6.3V30h4.41l6.3-6.29l3-3c.39-.39.39-1.03 0-1.42M19.59 28H18v-1.59l5-4.99L24.58 23zM26 21.59L24.41 20L26 18.41L27.59 20z"
        />
      </svg>
    );
  }

  // CUESTIONARIO
  if (type === "quiz") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="2048"
        height="2048"
        viewBox="0 0 2048 2048"
        className={`${className} text-[#65717f]`}
      >
        <path d="M0 0h2048v2048H0z" fill="none" />

        <path
          fill="currentColor"
          d="M1792 549v1499H128V0h1115zm-512-37h293l-293-293zm384 128h-512V128H256v1792h1408zM384 896h384v384H384zm128 256h128v-128H512zM384 384h384v384H384zm128 256h128V512H512zm384 384h640v128H896zm-512 384h384v384H384zm128 256h128v-128H512zm384-128h640v128H896z"
        />
      </svg>
    );
  }

  return null;
}