import Image from "next/image";
import { clsx } from "clsx";

/** Shows the company's uploaded logo (companyLogoURL from the dashboard), or its initials. */
export function CompanyLogo({
  name,
  logoURL,
  size = 52,
  className,
}: {
  name: string;
  logoURL: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {logoURL ? (
        <Image src={logoURL} alt={`${name} logo`} width={Math.round(size * 0.66)} height={Math.round(size * 0.66)} unoptimized />
      ) : (
        <span className="font-display font-bold text-brand-600" style={{ fontSize: size * 0.34 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
