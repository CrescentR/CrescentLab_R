import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="lab-footer">
      <div className="lab-shell lab-footer-inner">
        <div className="lab-footer-brand">
          <span aria-hidden="true" className="lab-crescent-mark" />
          <div>
            <strong>CRESCENT LAB</strong>
            <p>独立的数字研究实践。</p>
          </div>
        </div>
        <Link className="lab-footer-link" href="/about">
          关于这个站点
        </Link>
      </div>
    </footer>
  );
}
