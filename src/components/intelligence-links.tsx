import Link from "next/link";
export const intelligenceLinks=[ ["/organization","Dành cho tổ chức"], ["/investment","Đầu tư kỹ năng"], ["/transition","Chuyển nghề"], ["/intelligence","Nghề & kỹ năng"], ["/transformation","AI & nhiệm vụ"] ];
export function IntelligenceLinks(){return <nav className="analytics-jump" aria-label="Công cụ phân tích">{intelligenceLinks.map(([href,title])=><Link href={href} key={href}>{title}</Link>)}</nav>}
