import { Fragment } from "react";

// Render a small, safe subset of Markdown as React nodes, never raw HTML.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part,i)=>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2,-2)}</strong> :
    part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1,-1)}</code> : <Fragment key={i}>{part}</Fragment>);
}
export function AnswerText({text}:{text:string}) {
  return <div className="mapi-answer-body">{text.split(/\n\s*\n/).filter(Boolean).map((block,i)=>{
    const lines=block.trim().split("\n");
    if(lines.every(line=>/^\s*[-*] /.test(line))) return <ul key={i}>{lines.map((line,j)=><li key={j}>{inline(line.replace(/^\s*[-*] /,""))}</li>)}</ul>;
    if(lines.every(line=>/^\s*\d+[.)] /.test(line))) return <ol key={i}>{lines.map((line,j)=><li key={j}>{inline(line.replace(/^\s*\d+[.)] /,""))}</li>)}</ol>;
    return <div key={i}>{lines.map((line,j)=>/^#{1,4} /.test(line)?<h3 key={j}>{inline(line.replace(/^#{1,4} /,""))}</h3>:<p key={j}>{inline(line)}</p>)}</div>;
  })}</div>;
}
