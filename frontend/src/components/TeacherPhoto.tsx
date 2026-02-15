"use client";

interface TeacherPhotoProps {
  src: string;
  alt: string;
  className: string;
}

export function TeacherPhoto({ src, alt, className }: TeacherPhotoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}