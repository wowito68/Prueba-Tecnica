import Link from "next/link";
import { Icon } from "./icon";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Entre páginas, inicio">
      <span className="brand-mark">
        <Icon name="book" width="24" height="24" />
      </span>
      <span>
        Entre páginas<small>Club de lectura</small>
      </span>
    </Link>
  );
}
