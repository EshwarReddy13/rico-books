export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-auth-canvas text-black [color-scheme:light]"
      data-auth-page
    >
      {children}
    </div>
  );
}
