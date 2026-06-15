import { useState, useEffect } from "react";

const C = {
  navy: "#1B3A6B", teal: "#14B8B8", tealBg: "#D9F5F5",
  bg: "#F0F4F8", card: "#FFFFFF", text: "#111827",
  sub: "#4B5563", muted: "#9CA3AF", border: "#E5E7EB",
  red: "#EF4444", redBg: "#FEF2F2", green: "#059669",
};

const fmtHr = (h) => {
  const n = parseFloat(h) || 0, w = Math.floor(n);
  const half = Math.abs((n - w) - 0.5) < 0.001;
  return (!w && half) ? "½" : half ? `${w}½` : `${w}`;
};
const fmtMoney = (n) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d) => { if (!d) return ""; const [y,m,day] = d.split("-"); return `${day}/${m}/${y}`; };
const todayStr = () => new Date().toISOString().split("T")[0];

const DEF = {
  fromName: "Harshani Liyanaarachchi", toName: "Mina Group Cleaning Services",
  phone: "0401921966", email: "info@minagroup.com.au",
  website: "www.minagroup.com.au", transportRate: "0.109", defaultRate: "27",
};

function Stepper({ value, min=0, step=1, onChange }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6,background:C.bg,borderRadius:10,padding:"4px 6px" }}>
      <button onClick={() => onChange(Math.max(min, Math.round((Number(value)-step)*10)/10))}
        style={{ width:36,height:36,borderRadius:8,border:"none",background:C.card,color:C.navy,fontSize:22,fontWeight:700,cursor:"pointer",flexShrink:0,boxShadow:"0 1px 2px rgba(0,0,0,0.12)" }}>−</button>
      <span style={{ flex:1,textAlign:"center",fontWeight:700,fontSize:17,color:C.text }}>{value}</span>
      <button onClick={() => onChange(Math.round((Number(value)+step)*10)/10)}
        style={{ width:36,height:36,borderRadius:8,border:"none",background:C.navy,color:"white",fontSize:22,fontWeight:700,cursor:"pointer",flexShrink:0 }}>+</button>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background:C.card,borderRadius:13,padding:"13px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",...style }}>{children}</div>;
}

function Label({ children }) {
  return <div style={{ fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8 }}>{children}</div>;
}

function Input({ style, ...props }) {
  return <input {...props} style={{ width:"100%", maxWidth:"100%", margin: 0, padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:16,color:C.text,boxSizing:"border-box",outline:"none", background:"transparent", WebkitAppearance:"none", ...style }} />;
}

export default function App() {
  const [tab, setTab] = useState("add");
  const [settings, setSettings] = useState(DEF);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [printHtml, setPrintHtml] = useState(null);
  
  const [form, setForm] = useState({ date: todayStr(), location: "", houses: 1, hours: 4, rate: 27, km: "" });

  useEffect(() => {
    try { 
      const r = localStorage.getItem("mc_entries"); 
      if (r) setEntries(JSON.parse(r)); 
    } catch {}
    try {
      const r = localStorage.getItem("mc_settings");
      if (r) { 
        const s = JSON.parse(r); 
        setSettings(s); 
        setForm(f => ({...f, rate: Number(s.defaultRate)||27})); 
      }
    } catch {}
    setLoading(false);
  }, []);

  const saveE = (arr) => { try { localStorage.setItem("mc_entries", JSON.stringify(arr)); } catch {} };
  const saveS = (obj) => { try { localStorage.setItem("mc_settings", JSON.stringify(obj)); } catch {} };
  const updS = (patch) => { const next = {...settings,...patch}; setSettings(next); saveS(next); };

  const addEntry = () => {
    const next = [...entries, { ...form, id: Date.now() }];
    setEntries(next); saveE(next);
    setFlash(true); setTimeout(() => setFlash(false), 1600);
    setForm(f => ({...f, location: "", houses:1, hours:4, km:""}));
  };

  const delEntry = (id) => { const next = entries.filter(e => e.id !== id); setEntries(next); saveE(next); };
  const clearAll = () => { setEntries([]); saveE([]); setConfirmClear(false); };

  const totHours = entries.reduce((s,e) => s + Number(e.hours), 0);
  const totAmt   = entries.reduce((s,e) => s + Number(e.hours) * Number(e.rate), 0);
  const totKm    = entries.reduce((s,e) => s + (e.km ? Number(e.km) : 0), 0);
  const trans    = Math.round(totKm * Number(settings.transportRate) * 100) / 100;
  const grand    = totAmt + trans;

  const getLocName = (e, short = false) => {
    if (e.location && e.location.trim() !== "") return e.location;
    return `${e.houses} ${Number(e.houses)===1 ? (short?"Hse":"House") : (short?"Hses":"Houses")}`;
  };

  const doPrint = () => {
    const rows = entries.map(e => `
      <tr><td>${fmtDate(e.date)}</td><td>${getLocName(e)}</td>
      <td>${fmtHr(e.hours)}h</td><td>$${e.rate}</td>
      <td>${fmtMoney(Number(e.hours)*Number(e.rate))}</td>
      <td>${e.km ? e.km+"km" : "-"}</td></tr>`).join("");
      
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Invoice — ${settings.fromName}</title>
<style>
  body{font-family:Arial,sans-serif;padding:24px;color:#111;font-size:13px;background:#fff;}
  h1{font-size:28px;color:#1B3A6B;letter-spacing:1px;margin:0 0 4px}
  .hdr{display:flex;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid #1B3A6B;margin-bottom:20px}
  .hdr p{margin:3px 0}
  table{width:100%;border-collapse:collapse}
  th{background:#1B3A6B;color:#fff;padding:9px 10px;text-align:left;font-size:12px}
  td{padding:8px 10px;border-bottom:1px solid #e5e7eb}
  tr:nth-child(even) td{background:#f9fafb}
  .tot td{background:#1B3A6B!important;color:#fff;font-weight:bold}
  .grand{text-align:right;font-size:18px;font-weight:bold;color:#1B3A6B;margin-top:14px}
  .sub{text-align:right;font-size:12px;color:#4B5563;margin-top:5px}
</style></head><body>
<h1>INVOICE</h1>
<div class="hdr">
  <div>
    <p><strong>To: -</strong> ${settings.toName}</p>
    <p>Phone: - ${settings.phone}</p>
    <p>${settings.email}</p>
    <p>${settings.website}</p>
  </div>
  <div style="text-align:right">
    <p><strong>From: -</strong> ${settings.fromName}</p>
  </div>
</div>
<table>
<thead><tr><th>Date</th><th>Location</th><th>Hours</th><th>Rate</th><th>Amount</th><th>For Transport</th></tr></thead>
<tbody>
  ${rows}
  <tr class="tot">
    <td colspan="2">Total</td>
    <td>${fmtHr(totHours)}h</td><td></td>
    <td>${fmtMoney(totAmt)}</td>
    <td>${totKm>0 ? totKm+"km ("+fmtMoney(trans)+")" : "-"}</td>
  </tr>
</tbody></table>
${totKm>0 ? `<p class="sub">${fmtMoney(totAmt)} labour + ${fmtMoney(trans)} transport</p>` : ""}
<p class="grand">Grand Total: ${fmtMoney(grand)}</p>
</body></html>`;
    
    // Instead of opening a new window, we save the HTML to state to show the overlay
    setPrintHtml(html);
  };

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:250,color:C.muted,fontFamily:"system-ui",fontSize:15 }}>
      Loading...
    </div>
  );

  const TABS = [
    { k:"add",      icon:"➕", label:"Add" },
    { k:"entries",  icon:"📋", label:`Entries${entries.length ? ` (${entries.length})` : ""}` },
    { k:"invoice",  icon:"🧾", label:"Invoice" },
    { k:"settings", icon:"⚙️", label:"Settings" },
  ];

  const colW = "70px 65px 30px 50px 56px";

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",background:C.bg,minHeight:"100vh" }}>

      {/* ── Header */}
      <div style={{ background:C.navy,padding:"16px 16px 12px" }}>
        <div style={{ color:"white",fontSize:19,fontWeight:700 }}>🧹 Invoice Generator</div>
        <div style={{ color:"rgba(255,255,255,0.6)",fontSize:12,marginTop:2 }}>Mina Group Cleaning Services</div>
      </div>

      {/* ── Tab bar */}
      <div style={{ background:C.card,borderBottom:`1px solid ${C.border}`,display:"flex" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            flex:1,padding:"9px 2px 7px",border:"none",background:"transparent",cursor:"pointer",
            borderBottom: tab===t.k ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
            fontSize:10,fontWeight: tab===t.k ? 700 : 500,
            color: tab===t.k ? C.teal : C.muted,
            display:"flex",flexDirection:"column",alignItems:"center",gap:2
          }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Summary strip */}
      <div style={{ background:C.card,borderBottom:`1px solid ${C.border}`,display:"flex",padding:"10px 8px" }}>
        {[["Entries",entries.length],["Hours",fmtHr(totHours)+"h"],["Labour",fmtMoney(totAmt)],["Total",fmtMoney(grand)]].map(([l,v],i) => (
          <div key={l} style={{ flex:1,textAlign:"center",borderLeft: i>0 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontSize:10,color:C.muted }}>{l}</div>
            <div style={{ fontSize:15,fontWeight:700,color: i===3 ? C.teal : C.navy }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:14 }}>

        {/* ════ ADD ════════════════════════════════ */}
        {tab === "add" && (
          <div style={{ display:"flex",flexDirection:"column",gap:11 }}>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
              <Card>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({...f,date:e.target.value}))} />
              </Card>
              <Card>
                <Label>Houses</Label>
                <Stepper value={form.houses} min={1} onChange={v => setForm(f => ({...f,houses:v}))} />
              </Card>
            </div>

            <Card>
              <Label>Specific Location / Name (Optional)</Label>
              <Input type="text" value={form.location} onChange={e => setForm(f => ({...f,location:e.target.value}))} placeholder="e.g. Office Building, Smith Residence" />
            </Card>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
              <Card>
                <Label>Hours</Label>
                <Stepper value={form.hours} step={0.5} min={0.5} onChange={v => setForm(f => ({...f,hours:v}))} />
              </Card>
              <Card>
                <Label>Rate ($/hr)</Label>
                <Input type="number" value={form.rate} onChange={e => setForm(f => ({...f,rate:e.target.value}))} />
              </Card>
            </div>

            <Card>
              <Label>Distance (km)</Label>
              <Input type="number" value={form.km} onChange={e => setForm(f => ({...f,km:e.target.value}))} placeholder="Optional transport distance" />
            </Card>

            {/* Live preview */}
            <div style={{ background:C.tealBg,borderRadius:13,padding:"13px 14px",border:`1.5px solid ${C.teal}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700,color:C.navy,fontSize:15 }}>{fmtDate(form.date)}</div>
                  <div style={{ fontSize:13,color:C.sub,marginTop:3 }}>
                    <span style={{fontWeight:form.location?700:400, color:form.location?C.navy:C.sub}}>
                      {getLocName(form)}
                    </span> · {form.hours}h @ ${form.rate}/hr
                  </div>
                  {form.km ? <div style={{ fontSize:13,color:C.sub }}>🚗 {form.km}km transport</div> : null}
                </div>
                <div style={{ fontSize:24,fontWeight:800,color:C.navy }}>{fmtMoney(Number(form.hours)*Number(form.rate))}</div>
              </div>
            </div>

            <button onClick={addEntry} style={{
              width:"100%",padding:15,borderRadius:13,border:"none",
              background: flash ? C.green : C.navy,
              color:"white",fontSize:16,fontWeight:700,cursor:"pointer",transition:"background 0.3s"
            }}>
              {flash ? "✓  Entry added!" : "＋  Add entry"}
            </button>
          </div>
        )}

        {/* ════ ENTRIES ════════════════════════════ */}
        {tab === "entries" && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign:"center",padding:"56px 16px",color:C.muted }}>
                <div style={{ fontSize:44,marginBottom:14 }}>📋</div>
                <div style={{ fontSize:16,fontWeight:600,color:C.sub }}>No entries yet</div>
                <div style={{ fontSize:14,marginTop:5 }}>Tap Add to record your first work day</div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:10 }}>
                  {confirmClear ? (
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={() => setConfirmClear(false)} style={{ padding:"7px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",fontSize:13 }}>Cancel</button>
                      <button onClick={clearAll} style={{ padding:"7px 14px",borderRadius:8,border:"none",background:C.red,color:"white",cursor:"pointer",fontSize:13,fontWeight:700 }}>Yes, clear all</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmClear(true)} style={{ padding:"7px 14px",borderRadius:8,border:"none",background:C.redBg,color:C.red,cursor:"pointer",fontSize:13,fontWeight:600 }}>Clear all</button>
                  )}
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {[...entries].reverse().map(e => (
                    <div key={e.id} style={{ background:C.card,borderRadius:12,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",display:"flex",alignItems:"center" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"baseline" }}>
                          <span style={{ fontWeight:700,color:C.navy,fontSize:14 }}>{fmtDate(e.date)}</span>
                          <span style={{ fontWeight:700,color:C.text,fontSize:15 }}>{fmtMoney(Number(e.hours)*Number(e.rate))}</span>
                        </div>
                        <div style={{ fontSize:13,color:C.sub,marginTop:3 }}>
                          {e.location && <span style={{fontWeight:600, color:C.navy}}>{e.location} · </span>}
                          {e.houses} {Number(e.houses)===1?"house":"houses"} · {fmtHr(e.hours)}h @ ${e.rate}/hr
                          {e.km ? ` · 🚗 ${e.km}km` : ""}
                        </div>
                      </div>
                      <button onClick={() => delEntry(e.id)} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted,padding:"4px 8px",marginLeft:8 }}>🗑️</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ INVOICE ════════════════════════════ */}
        {tab === "invoice" && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign:"center",padding:"56px 16px",color:C.muted }}>
                <div style={{ fontSize:44,marginBottom:14 }}>🧾</div>
                <div style={{ fontSize:16,fontWeight:600,color:C.sub }}>Nothing to invoice yet</div>
                <div style={{ fontSize:14,marginTop:5 }}>Add your work entries first</div>
              </div>
            ) : (
              <>
                <Card style={{ padding:15 }}>
                  <div style={{ fontSize:22,fontWeight:800,color:C.navy,letterSpacing:2,marginBottom:14 }}>INVOICE</div>

                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14,paddingBottom:13,borderBottom:`2px solid ${C.navy}` }}>
                    <div style={{ fontSize:12 }}>
                      <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3 }}>To</div>
                      <div style={{ fontWeight:600,color:C.text }}>{settings.toName}</div>
                      <div style={{ color:C.sub }}>{settings.phone}</div>
                      <div style={{ color:C.sub,fontSize:11 }}>{settings.email}</div>
                      <div style={{ color:C.sub,fontSize:11 }}>{settings.website}</div>
                    </div>
                    <div style={{ fontSize:12,textAlign:"right" }}>
                      <div style={{ fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginBottom:3 }}>From</div>
                      <div style={{ fontWeight:700,color:C.navy,fontSize:13 }}>{settings.fromName}</div>
                    </div>
                  </div>

                  <div style={{ display:"grid",gridTemplateColumns:colW,gap:2,padding:"6px 7px",background:C.navy,borderRadius:8,marginBottom:3 }}>
                    {["Date","Location","Hrs","Amount","km"].map(h => (
                      <div key={h} style={{ fontSize:9,fontWeight:700,color:"white",textTransform:"uppercase" }}>{h}</div>
                    ))}
                  </div>

                  {entries.map((e,i) => (
                    <div key={e.id} style={{ display:"grid",gridTemplateColumns:colW,gap:2,padding:"6px 7px",background: i%2===0 ? "white" : C.bg,borderRadius:4 }}>
                      <div style={{ fontSize:10,color:C.sub }}>{fmtDate(e.date)}</div>
                      <div style={{ fontSize:10,color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontWeight:e.location?600:400 }}>
                        {getLocName(e, true)}
                      </div>
                      <div style={{ fontSize:10,color:C.text }}>{fmtHr(e.hours)}h</div>
                      <div style={{ fontSize:10,color:C.text }}>{fmtMoney(Number(e.hours)*Number(e.rate))}</div>
                      <div style={{ fontSize:10,color:C.sub }}>{e.km ? `${e.km}km` : "-"}</div>
                    </div>
                  ))}

                  <div style={{ display:"grid",gridTemplateColumns:colW,gap:2,padding:"7px 7px",background:C.navy,borderRadius:8,marginTop:4 }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"white" }}>Total</div>
                    <div></div>
                    <div style={{ fontSize:10,fontWeight:700,color:"white" }}>{fmtHr(totHours)}h</div>
                    <div style={{ fontSize:10,fontWeight:700,color:"white" }}>{fmtMoney(totAmt)}</div>
                    <div style={{ fontSize:10,color:"rgba(255,255,255,0.8)" }}>{totKm>0 ? `${totKm}km` : "-"}</div>
                  </div>

                  <div style={{ marginTop:13,padding:"13px 14px",background:C.tealBg,borderRadius:12,border:`1.5px solid ${C.teal}` }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div style={{ fontSize:13,color:C.sub }}>
                        <div>Labour: {fmtMoney(totAmt)}</div>
                        {totKm>0 && <div>🚗 {totKm}km: {fmtMoney(trans)}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5 }}>Grand total</div>
                        <div style={{ fontSize:27,fontWeight:800,color:C.navy }}>{fmtMoney(grand)}</div>
                      </div>
                    </div>
                  </div>
                </Card>

                <button onClick={doPrint} style={{ width:"100%",marginTop:12,padding:15,borderRadius:13,border:"none",background:C.teal,color:"white",fontSize:16,fontWeight:700,cursor:"pointer" }}>
                  🖨️  Preview & Save PDF
                </button>
              </>
            )}
          </div>
        )}

        {/* ════ SETTINGS ═══════════════════════════ */}
        {tab === "settings" && (
          <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
            {[
              ["Your name (From)", "fromName"],
              ["Client / company (To)", "toName"],
              ["Phone number", "phone"],
              ["Email address", "email"],
              ["Website", "website"],
            ].map(([label,key]) => (
              <Card key={key}>
                <Label>{label}</Label>
                <Input value={settings[key]} onChange={e => updS({ [key]: e.target.value })} />
              </Card>
            ))}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
              <Card>
                <Label>Default rate ($/hr)</Label>
                <Input type="number" value={settings.defaultRate} onChange={e => updS({ defaultRate: e.target.value })} />
              </Card>
              <Card>
                <Label>Transport rate ($/km)</Label>
                <Input type="number" step="0.01" value={settings.transportRate} onChange={e => updS({ transportRate: e.target.value })} />
              </Card>
            </div>
            <Card style={{ background:"#EFF6FF",border:"1px solid #BFDBFE" }}>
              <div style={{ fontSize:13,color:"#1E40AF" }}>✅ Settings are saved automatically as you type</div>
            </Card>
          </div>
        )}

      </div>

      {/* ════ PDF/PRINT OVERLAY ════════════════ */}
      {printHtml && (
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:C.card, zIndex:9999, display:"flex", flexDirection:"column" }}>
          {/* Header Bar */}
          <div style={{ padding:"12px 16px", background:C.navy, display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"calc(12px + env(safe-area-inset-top))" }}>
            <button onClick={() => setPrintHtml(null)} style={{ background:"transparent", border:"none", color:"white", fontSize:16, fontWeight:700, cursor:"pointer", padding:"8px 0" }}>
              ← Back to App
            </button>
            <button onClick={() => {
              const frm = document.getElementById("print-frame");
              if(frm) { frm.contentWindow.focus(); frm.contentWindow.print(); }
            }} style={{ background:C.teal, color:"white", border:"none", padding:"10px 18px", borderRadius:8, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 2px 4px rgba(0,0,0,0.2)" }}>
              🖨️ Print / Save
            </button>
          </div>
          {/* Document Preview */}
          <iframe id="print-frame" srcDoc={printHtml} title="Invoice Preview" style={{ flex:1, width:"100%", border:"none", background:"white" }} />
        </div>
      )}

    </div>
  );
}