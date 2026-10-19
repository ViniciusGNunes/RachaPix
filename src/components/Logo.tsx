// Marca única (header, footer e favicon): "R_" no peso e fonte do nome (Handjet), vetorizado.
// Mesmo desenho de src/app/icon.svg. Cores fixas para ser idêntico nos dois temas.
const LOGO_PATH =
  'M7.3 7h5.4v1.2h-5.4zM7.3 8.2h6.6v0.6h-6.6zM7.3 8.8h1.8v5.4h-1.8zM12.1 8.8h1.8v5.4h-1.8zM7.3 14.2h6.6v0.6h-6.6zM7.3 14.8h5.4v1.2h-5.4zM7.3 16h1.8v0.6h-1.8zM10.3 16h1.8v0.6h-1.8zM7.3 16.6h1.8v0.6h-1.8zM10.3 16.6h2.4v0.6h-2.4zM7.3 17.2h1.8v0.6h-1.8zM10.9 17.2h1.8v0.6h-1.8zM7.3 17.8h1.8v1.2h-1.8zM10.9 17.8h2.4v1.2h-2.4zM7.3 19h1.8v1.2h-1.8zM11.5 19h2.4v1.2h-2.4zM7.3 20.2h1.8v1.2h-1.8zM12.1 20.2h1.8v1.2h-1.8zM13.9 23.2h10.8v1.8h-10.8z';

export function LogoMark({ className = 'w-8 h-8 md:w-9 md:h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`${className} shrink-0 transition-transform`}
      aria-hidden="true"
    >{/* quadrado */}
      <rect width="32" height="32" rx="9" fill="#34d399" />
      <path d={LOGO_PATH} fill="#052e22" shapeRendering="crispEdges" />
    </svg>
  );
}
