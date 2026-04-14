import Link from "next/link";

type PaginatorProps = {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  cleanUrl?: boolean;
  query?: Record<string, string>;
};

export default function Paginator({
  currentPage,
  totalPages,
  baseUrl = "",
  cleanUrl = false,
  query = {},
}: PaginatorProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => {
        const page = i + 1;
        const params = new URLSearchParams(query);

        if (!cleanUrl) {
          params.set("page", String(page));
        }

        const queryString = params.toString();
        const href = cleanUrl
          ? `${baseUrl}/${page}${queryString ? `?${queryString}` : ""}`
          : `${baseUrl}${queryString ? `?${queryString}` : ""}`;

        return (
          <Link
            key={page}
            href={href}
            className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-ghost"}`}
            prefetch={false}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}
