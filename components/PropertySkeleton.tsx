/** Shown for a moment while a property that was not prebuilt loads for the first time. */
export function PropertySkeleton({ label }: { label: string }) {
  return (
    <div className="wrap" aria-busy="true" aria-label={label}>
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-title" />
      <div className="gallery">
        <div className="gallery-main skeleton" />
        <div className="gallery-side">
          <div className="skeleton gallery-tile" />
          <div className="skeleton gallery-tile" />
        </div>
      </div>
    </div>
  );
}
