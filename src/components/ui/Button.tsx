import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-block rounded-full px-8 py-3 font-semibold text-sm tracking-wide transition-all duration-300";
  const variants = {
    primary:
      "bg-accent text-background hover:bg-accent-bright hover:shadow-[0_0_20px_rgba(212,168,67,0.4)]",
    outline:
      "border-2 border-accent text-accent hover:bg-accent hover:text-background",
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
