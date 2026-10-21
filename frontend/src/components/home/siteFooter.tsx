import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="lab-footer">
      <div className="lab-shell lab-footer-inner">
        <div className="lab-footer-brand">
          <svg aria-hidden="true" className="lab-crescent-mark" width="26" height="26" viewBox="0 0 26 26">
            <path d="M17 2.5A11 11 0 1 0 23.5 17 8.5 8.5 0 0 1 17 2.5Z" />
          </svg>
          <div>
            <strong>CRESCENT INDEX</strong>
            <p>独立的数字创作与技术记录。</p>
          </div>
        </div>
        <Link className="lab-footer-link" href="/about">
          关于这个站点
        </Link>
      </div>
    </footer>
  );
}
