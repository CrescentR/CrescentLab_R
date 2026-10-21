"use client";
export default function PublicError({ reset }: { reset: () => void }) { return <section className="j-wrap j-error"><div className="j-state"><h1>内容暂时无法读取</h1><p>请稍后重试。</p><button className="j-btn" onClick={reset}>重新读取</button></div></section>; }
