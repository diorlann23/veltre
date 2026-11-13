export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <span className="relative block h-px w-24 overflow-hidden bg-line">
        <span className="absolute inset-y-0 left-0 w-1/3 animate-[marquee_1.1s_ease-in-out_infinite_alternate] bg-ink" />
      </span>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
