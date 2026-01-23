// src/shared/components/PageContainer.tsx
export default function PageContainer({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`max-w-6xl mx-auto px-6 pb-16 pt-14   /* ← aquí */ 
                  flex flex-col gap-y-6 ${className}`}
    >
      {children}
    </div>
  );
}
