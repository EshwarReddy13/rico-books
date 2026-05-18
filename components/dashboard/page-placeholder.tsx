export function PagePlaceholder({
  description = "Coming soon.",
}: {
  description?: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-12 text-center sm:rounded-3xl">
      <p className="text-sm text-zinc-600">{description}</p>
    </section>
  );
}
