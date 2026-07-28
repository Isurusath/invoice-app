import { useState, useEffect } from "react";

const C = {
  navy: "#1B3A6B", teal: "#14B8B8", tealBg: "#D9F5F5",
  bg: "#F0F4F8", card: "#FFFFFF", text: "#111827",
  sub: "#4B5563", muted: "#9CA3AF", border: "#E5E7EB",
  red: "#EF4444", redBg: "#FEF2F2", green: "#059669",
};

const fmtHr = (h) => {
  const n = parseFloat(h) || 0;
  const hrs = Math.floor(n);
  const mins = Math.round((n - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
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
  const [showFullInvoice, setShowFullInvoice] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ date: todayStr(), location: "", houses: 1, hr: 4, min: 0, rate: 27, km: "" });

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

  const addOrUpdateEntry = () => {
    const decHours = Number(form.hr || 0) + (Number(form.min || 0) / 60);
    
    let next;
    if (editingId) {
      next = entries.map(e => e.id === editingId ? { ...form, hours: decHours, id: editingId } : e);
    } else {
      next = [...entries, { ...form, hours: decHours, id: Date.now() }];
    }
    
    setEntries(next); saveE(next);
    setFlash(true); setTimeout(() => setFlash(false), 1600);
    
    setForm(f => ({...f, location: "", houses:1, hr:4, min:0, km:""}));
    setEditingId(null);
    
    if (editingId) setTimeout(() => setTab("entries"), 600);
  };

  const startEditing = (entry) => {
    setForm({
      date: entry.date,
      location: entry.location || "",
      houses: entry.houses || 1,
      hr: Math.floor(entry.hours),
      min: Math.round((entry.hours - Math.floor(entry.hours)) * 60),
      rate: entry.rate,
      km: entry.km || ""
    });
    setEditingId(entry.id);
    setTab("add");
  };

  const delEntry = (id) => { const next = entries.filter(e => e.id !== id); setEntries(next); saveE(next); };
  const clearAll = () => { setEntries([]); saveE([]); setConfirmClear(false); };

  const totHours = entries.reduce((s,e) => s + Number(e.hours), 0);
  const totAmt   = entries.reduce((s,e) => s + Number(e.hours) * Number(e.rate), 0);
  const totKm    = entries.reduce((s,e) => s + (e.km ? Number(e.km) : 0), 0);
  const trans    = Math.round(totKm * Number(settings.transportRate) * 100) / 100;
  const grand    = totAmt + trans;

  const getLocName = (e) => {
    if (e.location && e.location.trim() !== "") return e.location;
    return `${e.houses} ${Number(e.houses)===1 ? "House" : "Houses"}`;
  };

  const generateHtml = () => {
    const rows = entries.map(e => `
      <tr><td>${fmtDate(e.date)}</td><td>${getLocName(e)}</td>
      <td>${fmtHr(e.hours)}</td><td>$${e.rate}</td>
      <td>${fmtMoney(Number(e.hours)*Number(e.rate))}</td>
      <td>${e.km ? e.km+"km" : "-"}</td></tr>`).join("");
      
    // I replaced the buggy scaling tricks with standard Responsive CSS (@media screen).
    // Now it adjusts font sizes cleanly on mobile, and stays huge for the Print PDF.
    return `<!DOCTYPE html><html><head><title>Invoice — ${settings.fromName}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  @page { margin: 10mm; size: auto; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #111; box-sizing: border-box; }
  .invoice-box { padding: 30px; max-width: 800px; margin: 0 auto; box-sizing: border-box; }
  
  h1 { font-size: 32px; color: #1B3A6B; letter-spacing: 1px; margin: 0 0 8px; }
  .hdr { display: flex; justify-content: space-between; padding-bottom: 16px; border-bottom: 2px solid #1B3A6B; margin-bottom: 20px; }
  .hdr p { margin: 4px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1B3A6B; color: #fff; padding: 12px; text-align: left; font-size: 13px; }
  td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .tot td { background: #1B3A6B !important; color: #fff; font-weight: bold; padding: 14px 12px; }
  .grand { text-align: right; font-size: 24px; font-weight: bold; color: #1B3A6B; margin-top: 20px; }
  .sub { text-align: right; font-size: 14px; color: #4B5563; margin-top: 8px; }

  /* Mobile Responsive View - Only applies to the on-screen preview */
  @media screen and (max-width: 600px) {
    .invoice-box { padding: 12px; }
    h1 { font-size: 22px; margin-bottom: 6px; }
    .hdr { padding-bottom: 10px; margin-bottom: 14px; flex-direction: row; }
    .hdr p { font-size: 11px; margin: 2px 0; }
    th { padding: 8px 6px; font-size: 11px; }
    td { padding: 8px 6px; font-size: 11px; }
    .tot td { padding: 10px 6px; font-size: 12px; }
    .grand { font-size: 18px; margin-top: 14px; }
    .sub { font-size: 11px; }
  }
</style></head><body>
<div class="invoice-box">
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
  <thead><tr><th>Date</th><th>Location</th><th>Time</th><th>Rate</th><th>Amount</th><th>For Transport</th></tr></thead>
  <tbody>
    ${rows}
    <tr class="tot">
      <td colspan="2">Total</td>
      <td>${fmtHr(totHours)}</td><td></td>
      <td>${fmtMoney(totAmt)}</td>
      <td>${totKm>0 ? totKm+"km ("+fmtMoney(trans)+")" : "-"}</td>
    </tr>
  </tbody></table>
  ${totKm>0 ? `<p class="sub">${fmtMoney(totAmt)} labour + ${fmtMoney(trans)} transport</p>` : ""}
  <p class="grand">Grand Total: ${fmtMoney(grand)}</p>
</div>
</body></html>`;
  };

  const doPrint = () => {
    const html = generateHtml();
    setPrintHtml(html);
    setShowFullInvoice(true);
  };

  const downloadPdf = () => {
    const html = generateHtml();
    const printWin = window.open("", "_blank");
    
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      
      setTimeout(() => {
        printWin.print();
        printWin.close(); 
      }, 300);
      
    } else {
      alert("Please allow popups in your browser to download the PDF.");
    }
  };

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:250,color:C.muted,fontFamily:"system-ui",fontSize:15 }}>
      Loading...
    </div>
  );

  const TABS = [
    { k:"add",      icon: editingId ? "✏️" : "➕", label: editingId ? "Edit" : "Add" },
    { k:"entries",  icon:"📋", label:`Entries${entries.length ? ` (${entries.length})` : ""}` },
    { k:"invoice",  icon:"🧾", label:"Invoice" },
    { k:"settings", icon:"⚙️", label:"Settings" },
  ];

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif",background:C.bg,minHeight:"100vh" }}>

      {/* ── Perfected Popup Modal Overlay ── */}
      {showFullInvoice && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", boxSizing: "border-box" }}>
          
          <div style={{ background: "#fff", width: "100%", maxWidth: "450px", height: "90%", maxHeight: "90%", borderRadius: "14px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}`, zIndex: 10 }}>
              <button onClick={() => setShowFullInvoice(false)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: C.sub, padding: 0, width: "60px", textAlign: "left" }}>✕</button>
              <h3 style={{ margin: 0, color: C.navy, fontSize: "16px", fontWeight: "700", flex: 1, textAlign: "center" }}>Preview</h3>
              <button onClick={downloadPdf} style={{ background: "transparent", border: "none", fontSize: "15px", cursor: "pointer", color: C.teal, padding: 0, fontWeight: "700", width: "60px", textAlign: "right" }}>Print</button>
            </div>
            
            {/* Standard responsive iframe container */}
            <div style={{ flex: 1, backgroundColor: "#fff", position: "relative", overflow: "hidden" }}>
               <iframe 
                  srcDoc={printHtml} 
                  style={{ border: "none", width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} 
                  title="Invoice Preview" 
               />
            </div>
            
          </div>
        </div>
      )}

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
        {[["Entries",entries.length],["Time",fmtHr(totHours)],["Labour",fmtMoney(totAmt)],["Total",fmtMoney(grand)]].map(([l,v],i) => (
          <div key={l} style={{ flex:1,textAlign:"center",borderLeft: i>0 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ fontSize:10,color:C.muted }}>{l}</div>
            <div style={{ fontSize:15,fontWeight:700,color: i===3 ? C.teal : C.navy }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:14 }}>

        {/* ════ ADD / EDIT ════════════════════════════════ */}
        {tab === "add" && (
          <div style={{ display:"flex",flexDirection:"column",gap:11 }}>

            {editingId && (
              <div style={{ background: C.tealBg, padding: "10px", borderRadius: 10, color: C.teal, fontWeight: 700, textAlign: "center", fontSize: 14 }}>
                ✏️ Editing Existing Entry
              </div>
            )}

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
                <Label>Time Worked</Label>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <Input type="number" min="0" value={form.hr} onChange={e => setForm(f => ({...f,hr:e.target.value}))} placeholder="Hr" style={{ padding: "10px 8px" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>h</span>
                  <Input type="number" min="0" max="59" value={form.min} onChange={e => setForm(f => ({...f,min:e.target.value}))} placeholder="Min" style={{ padding: "10px 8px" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>m</span>
                </div>
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
                    </span> · {Number(form.hr)||0}h {Number(form.min)||0}m @ ${form.rate}/hr
                  </div>
                  {form.km ? <div style={{ fontSize:13,color:C.sub }}>🚗 {form.km}km transport</div> : null}
                </div>
                <div style={{ fontSize:24,fontWeight:800,color:C.navy }}>
                   {fmtMoney((Number(form.hr || 0) + (Number(form.min || 0) / 60)) * Number(form.rate))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {editingId && (
                <button onClick={() => {
                  setEditingId(null);
                  setForm({ date: todayStr(), location: "", houses: 1, hr: 4, min: 0, rate: Number(settings.defaultRate)||27, km: "" });
                  setTab("entries");
                }} style={{ flex: 1, padding:15, borderRadius:13, border:"none", background: C.sub, color:"white", fontSize:15, fontWeight:700, cursor:"pointer" }}>
                  Cancel
                </button>
              )}
              <button onClick={addOrUpdateEntry} style={{
                flex: 2, padding:15, borderRadius:13, border:"none",
                background: flash ? C.green : C.navy,
                color:"white", fontSize:16, fontWeight:700, cursor:"pointer", transition:"background 0.3s"
              }}>
                {flash ? "✓  Saved!" : (editingId ? "💾  Update Entry" : "＋  Add Entry")}
              </button>
            </div>
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
                          <span style={{fontWeight:e.location?700:400, color:e.location?C.navy:C.sub}}>
                            {getLocName(e)}
                          </span> · {fmtHr(e.hours)} @ ${e.rate}/hr
                        </div>
                        {e.km ? <div style={{ fontSize:13,color:C.sub }}>🚗 {e.km}km transport</div> : null}
                      </div>
                      
                      <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                        {/* Edit Button */}
                        <button onClick={() => startEditing(e)} style={{ width:36,height:36,borderRadius:8,border:"none",background:C.tealBg,color:C.teal,fontSize:16,fontWeight:700,cursor:"pointer",flexShrink:0 }}>✏️</button>
                        {/* Delete Button */}
                        <button onClick={() => delEntry(e.id)} style={{ width:36,height:36,borderRadius:8,border:"none",background:C.redBg,color:C.red,fontSize:18,fontWeight:700,cursor:"pointer",flexShrink:0 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ INVOICE ════════════════════════════ */}
        {tab === "invoice" && (
          <div style={{ padding: 14 }}>
            <button onClick={doPrint} style={{ width:"100%",padding:15,borderRadius:13,border:"none",background:C.navy,color:"white",fontSize:16,fontWeight:700,cursor:"pointer" }}>
               📄 Generate & Preview Invoice
            </button>
            <p style={{ textAlign: "center", color: C.sub, fontSize: 13, marginTop: 12 }}>
               Tap above to open the invoice modal. You can print or download the PDF from there.
            </p>
          </div>
        )}

        {/* ════ SETTINGS ════════════════════════════ */}
        {tab === "settings" && (
          <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
            <Card>
              <Label>Default Hourly Rate ($)</Label>
              <Input type="number" value={settings.defaultRate} onChange={e => updS({defaultRate:e.target.value})} />
            </Card>
            <Card>
              <Label>Transport Rate ($/km)</Label>
              <Input type="number" value={settings.transportRate} onChange={e => updS({transportRate:e.target.value})} />
            </Card>
            <Card>
              <Label>From Name</Label>
              <Input type="text" value={settings.fromName} onChange={e => updS({fromName:e.target.value})} />
            </Card>
             <Card>
              <Label>To Name</Label>
              <Input type="text" value={settings.toName} onChange={e => updS({toName:e.target.value})} />
            </Card>
            <Card>
              <Label>Phone</Label>
              <Input type="text" value={settings.phone} onChange={e => updS({phone:e.target.value})} />
            </Card>
            <Card>
              <Label>Email</Label>
              <Input type="text" value={settings.email} onChange={e => updS({email:e.target.value})} />
            </Card>
            <Card>
              <Label>Website</Label>
              <Input type="text" value={settings.website} onChange={e => updS({website:e.target.value})} />
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}