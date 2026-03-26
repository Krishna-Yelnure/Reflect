import{c as U,Y as g,f as j,Z as k,r as b,Q as W,U as _,j as e,L as R,M as B,_ as q,$ as J,N as Y,X as M,u as S,a0 as V,a1 as E,m as X,B as v,H as T,v as G,w as Q,x as Z,y as K,z as ee,C as te,D as se,E as ae,J as y}from"./index-BruSwfxA.js";import{C}from"./card-BBTxbRFz.js";import{D as ne}from"./download-BMM_vj5U.js";import{T as re}from"./trash-2-tIaGLKZK.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]],P=U("upload",ie);function oe(){const r=g.backup.exportAll(),d=new Blob([r],{type:"application/json"}),n=URL.createObjectURL(d),i=document.createElement("a");i.href=n,i.download=`journal-export-${j(new Date,"yyyy-MM-dd")}.json`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}function le(){const r=g.entries.getAll(),d=[...r].sort((t,a)=>new Date(t.date).getTime()-new Date(a.date).getTime()),n=g.eras.getAll(),i=g.anchors.getAll(),c=g.habits.getAll(),h=g.engagements.getAll(),l=g.threads.getAll();let s=`# Journal Export

`;s+=`Exported: ${j(new Date,"MMMM d, yyyy")}

`,s+=`---

`,i.length>0&&(s+=`## Core Values & Intentions

`,i.forEach(t=>{s+=`- **${t.type==="value"?"Value":"Intention"}:** ${t.text}
`}),s+=`
---

`),n.length>0&&(s+=`## Life Eras

`,[...n].sort((a,m)=>new Date(a.startDate).getTime()-new Date(m.startDate).getTime()).forEach(a=>{const m=a.endDate?j(k(a.endDate),"MMM d, yyyy"):"Present";s+=`- **${a.name}** (${j(k(a.startDate),"MMM d, yyyy")} – ${m})
`,a.description&&(s+=`  > ${a.description}
`)}),s+=`
---

`),c.length>0&&(s+=`## Habits

`,c.forEach(t=>{const a=h.filter(m=>m.habitId===t.id).length;s+=`- **${t.name}** ${t.isArchived?"(Archived)":""}
`,t.why&&(s+=`  - *Why:* ${t.why}
`),s+=`  - *Engaged:* ${a} times
`}),s+=`
---

`),l.length>0&&(s+=`## Memory Threads

`,l.forEach(t=>{s+=`- **${t.name}** (${t.entryIds.length} entries stitched together)
`,t.description&&(s+=`  > ${t.description}
`)}),s+=`
---

`),s+=`## Journal Entries

`,s+=`Total Entries: ${r.length}

`,d.forEach(t=>{let a=t.date;try{a.startsWith("reflection-")?a.startsWith("reflection-weekly-")?a=`Week of ${j(k(a.replace("reflection-weekly-","")),"MMM d, yyyy")}`:a.startsWith("reflection-monthly-")&&(a=`Month of ${a.replace("reflection-monthly-","")}`):a=j(k(a),"EEEE, MMMM d, yyyy")}catch{}s+=`### ${a}

`,t.mood&&(s+=`**Mood:** ${t.mood}`,t.energy&&(s+=` | **Energy:** ${t.energy}/5`),s+=`

`),t.tags&&t.tags.length>0&&(s+=`**Tags:** ${t.tags.join(", ")}

`),t.reflectionType&&t.reflectionType!=="daily"&&(s+=`**Type:** ${t.reflectionType} reflection

`),t.whatHappened&&(s+=`**What happened?**
${t.whatHappened}

`),t.feelings&&(s+=`**How did it feel?**
${t.feelings}

`),t.whatMatters&&(s+=`**What mattered most?**
${t.whatMatters}

`),t.insight&&(s+=`**Insight**
${t.insight}

`),t.intention&&(s+=`**Intention**
*${t.intention}*

`),t.freeWrite&&(s+=`**Free write**
${t.freeWrite}

`),s+=`---

`});const x=new Blob([s],{type:"text/markdown"}),f=URL.createObjectURL(x),u=document.createElement("a");u.href=f,u.download=`journal-export-${j(new Date,"yyyy-MM-dd")}.md`,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(f)}function de(r){return new Promise((d,n)=>{const i=new FileReader;i.onload=c=>{var h;try{const l=(h=c.target)==null?void 0:h.result,s=g.backup.mergeAll(l);d(s)}catch(l){n(l)}},i.onerror=()=>n(new Error("Error reading file")),i.readAsText(r)})}var $="Switch",[ce]=Y($),[he,me]=ce($),I=b.forwardRef((r,d)=>{const{__scopeSwitch:n,name:i,checked:c,defaultChecked:h,required:l,disabled:s,value:x="on",onCheckedChange:f,form:u,...t}=r,[a,m]=b.useState(null),o=W(d,N=>m(N)),p=b.useRef(!1),D=a?u||!!a.closest("form"):!0,[w=!1,O]=_({prop:c,defaultProp:h,onChange:f});return e.jsxs(he,{scope:n,checked:w,disabled:s,children:[e.jsx(R.button,{type:"button",role:"switch","aria-checked":w,"aria-required":l,"data-state":F(w),"data-disabled":s?"":void 0,disabled:s,value:x,...t,ref:o,onClick:B(r.onClick,N=>{O(H=>!H),D&&(p.current=N.isPropagationStopped(),p.current||N.stopPropagation())})}),D&&e.jsx(pe,{control:a,bubbles:!p.current,name:i,value:x,checked:w,required:l,disabled:s,form:u,style:{transform:"translateX(-100%)"}})]})});I.displayName=$;var z="SwitchThumb",L=b.forwardRef((r,d)=>{const{__scopeSwitch:n,...i}=r,c=me(z,n);return e.jsx(R.span,{"data-state":F(c.checked),"data-disabled":c.disabled?"":void 0,...i,ref:d})});L.displayName=z;var pe=r=>{const{control:d,checked:n,bubbles:i=!0,...c}=r,h=b.useRef(null),l=q(n),s=J(d);return b.useEffect(()=>{const x=h.current,f=window.HTMLInputElement.prototype,t=Object.getOwnPropertyDescriptor(f,"checked").set;if(l!==n&&t){const a=new Event("click",{bubbles:i});t.call(x,n),x.dispatchEvent(a)}},[l,n,i]),e.jsx("input",{type:"checkbox","aria-hidden":!0,defaultChecked:n,...c,tabIndex:-1,ref:h,style:{...r.style,...s,position:"absolute",pointerEvents:"none",opacity:0,margin:0}})};function F(r){return r?"checked":"unchecked"}var ue=I,xe=L;function A({className:r,...d}){return e.jsx(ue,{"data-slot":"switch",className:M("peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",r),...d,children:e.jsx(xe,{"data-slot":"switch-thumb",className:M("bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0")})})}function ye({entries:r,onImport:d}){const[n,i]=b.useState(S.get()),[c,h]=b.useState(!1),l=(t,a)=>{const m={...n,[t]:a};i(m),S.save({[t]:a}),y.success("Preference updated")},s=()=>{oe(),y.success("All journal data exported")},x=()=>{le(),y.success("All journal data exported as Markdown")},f=async t=>{var m;const a=(m=t.target.files)==null?void 0:m[0];if(a){try{const o=await de(a),p=[];o.entriesAdded>0&&p.push(`${o.entriesAdded} ${o.entriesAdded===1?"entry":"entries"}`),o.erasAdded>0&&p.push(`${o.erasAdded} ${o.erasAdded===1?"era":"eras"}`),o.habitsAdded>0&&p.push(`${o.habitsAdded} ${o.habitsAdded===1?"habit":"habits"}`),o.anchorsAdded>0&&p.push(`${o.anchorsAdded} ${o.anchorsAdded===1?"value/intention":"values/intentions"}`),o.questionsAdded>0&&p.push(`${o.questionsAdded} ${o.questionsAdded===1?"question":"questions"}`),o.threadsAdded>0&&p.push(`${o.threadsAdded} ${o.threadsAdded===1?"thread":"threads"}`),d(),p.length===0?y.success("Import complete",{description:"Everything was already up to date. No duplicates added."}):y.success("Import complete",{description:`Added: ${p.join(", ")}.`})}catch{y.error("Failed to import data",{description:"The file may be corrupted or in an unsupported format."})}t.target.value=""}},u=()=>{localStorage.clear(),window.location.reload()};return e.jsxs("div",{className:"max-w-3xl mx-auto px-6 py-8",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("h2",{className:"text-2xl mb-2",children:"Privacy & Data"}),e.jsx("p",{className:"text-stone-600",children:"Your data never leaves this device. You have complete control."})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs(C,{className:"p-6",children:[e.jsxs("div",{className:"flex items-start gap-4 mb-6",children:[e.jsx(V,{className:"size-5 text-stone-600 mt-1"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-medium mb-1",children:"Insights & Analysis"}),e.jsx("p",{className:"text-sm text-stone-600",children:"Control how the app analyzes your entries"})]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx(E,{htmlFor:"insights-enabled",children:"Enable insights"}),e.jsx("p",{className:"text-sm text-stone-500",children:"Surface patterns and observations"})]}),e.jsx(A,{id:"insights-enabled",checked:n.insightsEnabled,onCheckedChange:t=>l("insightsEnabled",t)})]}),n.insightsEnabled&&e.jsxs(X.div,{initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},className:"pl-6 space-y-4 border-l-2 border-stone-200",children:[e.jsxs("div",{children:[e.jsx(E,{className:"text-sm text-stone-600 mb-2 block",children:"Insight frequency"}),e.jsx("div",{className:"flex gap-2",children:["weekly","monthly","off"].map(t=>e.jsx(v,{variant:n.insightFrequency===t?"default":"outline",size:"sm",onClick:()=>l("insightFrequency",t),className:"capitalize",children:t},t))})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx(E,{htmlFor:"language-analysis",children:"Language pattern analysis"}),e.jsx("p",{className:"text-sm text-stone-500",children:"Detect writing patterns"})]}),e.jsx(A,{id:"language-analysis",checked:n.languageAnalysisEnabled,onCheckedChange:t=>l("languageAnalysisEnabled",t)})]})]}),e.jsxs("div",{className:"flex items-center justify-between pt-2 border-t border-stone-200/60",children:[e.jsxs("div",{className:"flex-1",children:[e.jsx(E,{htmlFor:"memory-reminders",children:"Memory surfacing"}),e.jsx("p",{className:"text-sm text-stone-500",children:"Show related past entries"})]}),e.jsx(A,{id:"memory-reminders",checked:n.memoryRemindersEnabled,onCheckedChange:t=>l("memoryRemindersEnabled",t)})]})]})]}),e.jsxs(C,{className:"p-6",children:[e.jsxs("div",{className:"flex items-start gap-4 mb-6",children:[e.jsx(ne,{className:"size-5 text-stone-600 mt-1"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-medium mb-1",children:"Export Your Data"}),e.jsx("p",{className:"text-sm text-stone-600",children:"Download all your journal entries"})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3",children:[e.jsxs(v,{variant:"outline",onClick:s,className:"gap-2 flex-1",disabled:r.length===0,children:[e.jsx(T,{className:"size-4"}),"Export as JSON"]}),e.jsxs(v,{variant:"outline",onClick:x,className:"gap-2 flex-1",disabled:r.length===0,children:[e.jsx(T,{className:"size-4"}),"Export as Markdown"]})]})]}),e.jsxs(C,{className:"p-6",children:[e.jsxs("div",{className:"flex items-start gap-4 mb-6",children:[e.jsx(P,{className:"size-5 text-stone-600 mt-1"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-medium mb-1",children:"Import Data"}),e.jsx("p",{className:"text-sm text-stone-600",children:"Restore from a previous export"})]})]}),e.jsxs("div",{children:[e.jsx("input",{type:"file",accept:".json",onChange:f,className:"hidden",id:"import-file"}),e.jsxs(v,{variant:"outline",onClick:()=>{var t;return(t=document.getElementById("import-file"))==null?void 0:t.click()},className:"gap-2",children:[e.jsx(P,{className:"size-4"}),"Choose File to Import"]})]})]}),e.jsxs(C,{className:"p-6 border-red-200 bg-red-50",children:[e.jsxs("div",{className:"flex items-start gap-4 mb-4",children:[e.jsx(re,{className:"size-5 text-red-600 mt-1"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"font-medium text-red-900 mb-1",children:"Delete All Data"}),e.jsx("p",{className:"text-sm text-red-700",children:"Permanently erase all journal entries and settings. This cannot be undone."})]})]}),e.jsx(v,{variant:"outline",onClick:()=>h(!0),className:"border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800",children:"Delete Everything"})]})]}),e.jsxs("div",{className:"mt-8 p-6 rounded-lg",style:{backgroundColor:"#E8E2D8"},children:[e.jsx("h3",{className:"font-medium mb-2",children:"Privacy Guarantee"}),e.jsxs("ul",{className:"text-sm text-stone-600 space-y-2",children:[e.jsx("li",{children:"• All data is stored locally in your browser"}),e.jsx("li",{children:"• Nothing is sent to external servers"}),e.jsx("li",{children:"• No analytics or tracking"}),e.jsx("li",{children:"• No accounts or authentication"}),e.jsx("li",{children:"• You own your data completely"})]})]}),e.jsx(G,{open:c,onOpenChange:h,children:e.jsxs(Q,{children:[e.jsxs(Z,{children:[e.jsx(K,{children:"Delete all journal data?"}),e.jsx(ee,{children:"This will permanently delete all your journal entries, settings, and preferences. This action cannot be undone. Consider exporting your data first."})]}),e.jsxs(te,{children:[e.jsx(se,{children:"Cancel"}),e.jsx(ae,{onClick:u,className:"bg-red-600 hover:bg-red-700",children:"Delete Everything"})]})]})})]})}export{ye as PrivacySettings};
