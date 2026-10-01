import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  showText?: boolean;
  className?: string;
};

export function Logo({
  href = "/dashboard",
  showText = true,
  className = "",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 ${className}`}
      aria-label="ContaCerta"
    >
      <Image
        src="/icons/icon-192.png"
        alt="ContaCerta"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-xl object-contain"
        priority
      />

      {showText && (
        <span className="text-[17px] font-semibold tracking-tight text-dark-text">
          Conta<span className="text-brandGlow">Certa</span>
        </span>
      )}
    </Link>
  );
}
