import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://aknsqvocpdwvrsoilfgw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FLQTXdsMkW6GzygyjhGk0w_VuhkIfEn";

async function sbFetch(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "resolution=merge-duplicates" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "DELETE" || res.status === 204) return [];
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function loadBookings() { return await sbFetch("GET", "/bookings?select=*&limit=1000"); }
async function upsertBooking(row) { return await sbFetch("POST", "/bookings", row); }
async function deleteBooking(slotKey) { return await sbFetch("DELETE", `/bookings?slot_key=eq.${encodeURIComponent(slotKey)}`); }

const COACHES = [
  { id:"admin",   name:"Admin",          pin:"1234", role:"Administrator" },
  { id:"coach1",  name:"Senior Mens",    pin:"1234", role:"Senior Mens" },
  { id:"coach2",  name:"Reserve Mens",   pin:"1234", role:"Reserve Mens" },
  { id:"coach3",  name:"Minor Boys",     pin:"1234", role:"Minor Boys" },
  { id:"coach4",  name:"U16 Boys",       pin:"1234", role:"U16 Boys" },
  { id:"coach5",  name:"U15 Boys",       pin:"1234", role:"U15 Boys" },
  { id:"coach6",  name:"U14 Boys",       pin:"1234", role:"U14 Boys" },
  { id:"coach7",  name:"U13 Boys",       pin:"1234", role:"U13 Boys" },
  { id:"coach8",  name:"U12 Boys",       pin:"1234", role:"U12 Boys" },
  { id:"coach9",  name:"U10 Boys",       pin:"1234", role:"U10 Boys" },
  { id:"coach10", name:"U8 Boys",        pin:"1234", role:"U8 Boys" },
  { id:"coach11", name:"U6 Boys",        pin:"1234", role:"U6 Boys" },
  { id:"coach12", name:"Senior Ladies",  pin:"1234", role:"Senior Ladies" },
  { id:"coach13", name:"Reserve Ladies", pin:"1234", role:"Reserve Ladies" },
  { id:"coach14", name:"Minor Girls",    pin:"1234", role:"Minor Girls" },
  { id:"coach15", name:"U16 Girls",      pin:"1234", role:"U16 Girls" },
  { id:"coach16", name:"U15 Girls",      pin:"1234", role:"U15 Girls" },
  { id:"coach17", name:"U14 Girls",      pin:"1234", role:"U14 Girls" },
  { id:"coach18", name:"U13 Girls",      pin:"1234", role:"U13 Girls" },
  { id:"coach19", name:"U12 Girls",      pin:"1234", role:"U12 Girls" },
  { id:"coach20", name:"U10 Girls",      pin:"1234", role:"U10 Girls" },
  { id:"coach21", name:"U8 Girls",       pin:"1234", role:"U8 Girls" },
  { id:"coach22", name:"U6 Girls",       pin:"1234", role:"U6 Girls" },
];

const PITCHES = [
  { id:"main",       name:"Pearse Park",    irishName:"Páirc an Phiarsaigh", icon:"⚽", accent:"#1d4ed8", desc:"Full size · 15-a-side",       halfable:true,  mapsUrl:"https://maps.app.goo.gl/TyPtsghScR16xWW19" },
  { id:"hurson",     name:"Hurson Park",    irishName:"Páirc Uí Ursain",     icon:"🏃", accent:"#1d4ed8", desc:"Training pitch",               halfable:true,  mapsUrl:"https://maps.app.goo.gl/aDr1v1QNh4AkReC79" },
  { id:"parcnagael", name:"Parc Na Gael",   irishName:"Páirc na nGael",      icon:"🏃", accent:"#1d4ed8", desc:"Training pitch",               halfable:true,  mapsUrl:"https://maps.app.goo.gl/nAFtNV1tackyVg3x5" },
  { id:"juvenile",   name:"Parc Na Nog",    irishName:"Páirc na nÓg",        icon:"👦", accent:"#1d4ed8", desc:"Youth pitch",                  halfable:false, mapsUrl:"https://maps.app.goo.gl/5ehtP5RoEgWrjs897" },
  { id:"gym",        name:"Gym",            irishName:"An Halla",             icon:"🏋️", accent:"#1d4ed8", desc:"Bookable hall",                halfable:false, mapsUrl:"https://maps.app.goo.gl/7cHTtWrHdTReejnD8" },
  { id:"committee",  name:"Committee Room", irishName:"Seomra Coiste",        icon:"🪑", accent:"#ea580c", desc:"Meeting room · max 20 people", halfable:false, mapsUrl:"https://maps.app.goo.gl/TyPtsghScR16xWW19" },
];

const TIMES = ["06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00"];
const DURATIONS = ["30 mins","1 hour","1.5 hours","2 hours"];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function getDateKey(d){ return d.toISOString().split("T")[0]; }
function getDurationSlots(dur){ return dur==="30 mins"?1:dur==="1 hour"?2:dur==="1.5 hours"?3:4; }
function getWeekDates(base){
  const s=new Date(base); const diff=s.getDay()===0?-6:1-s.getDay(); s.setDate(s.getDate()+diff);
  return Array.from({length:7},(_,i)=>{ const d=new Date(s); d.setDate(s.getDate()+i); return d; });
}
function slotKey(pid,half,dk,t){ return `${pid}|${half}|${dk}|${t}`; }
function rowsToMap(rows){
  const m={};
  rows.forEach(r=>{ m[r.slot_key]={ coachId:r.coach_id, coachName:r.coach_name, group:r.group_name, duration:r.duration, time:r.start_time, half:r.half, continuation:r.continuation||false }; });
  return m;
}

export default function App() {
  const [coach, setCoach]           = useState(null);
  const [loginName, setLoginName]   = useState("");
  const [loginPin, setLoginPin]     = useState("");
  const [loginErr, setLoginErr]     = useState("");
  const [showLogin, setShowLogin]   = useState(false);
  const [bookings, setBookings]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [dbError, setDbError]       = useState(false);
  const [view, setView]             = useState("schedule");
  const [selPitch, setSelPitch]     = useState(null);
  const [selHalf, setSelHalf]       = useState("full");
  const [selDate, setSelDate]       = useState(null);
  const [selTime, setSelTime]       = useState(null);
  const [selDur, setSelDur]         = useState("1 hour");
  const [weekOffset, setWeekOffset] = useState(0);
  const [confirmModal, setConfirmModal] = useState(null);
  const [calPrompt, setCalPrompt]   = useState(null);
  const [toast, setToast]           = useState(null);
  const [blockBook, setBlockBook]   = useState(false);
  const [blockWeeks, setBlockWeeks] = useState(4);

  const today = new Date();
  const base  = new Date(today); base.setDate(today.getDate()+weekOffset*7);
  const week  = getWeekDates(base);

  const fetchBookings = useCallback(async () => {
    try {
      const rows = await loadBookings();
      if (Array.isArray(rows)) { setBookings(rowsToMap(rows)); setDbError(false); }
    } catch(e) { setDbError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetchBookings(); const i=setInterval(fetchBookings,30000); return ()=>clearInterval(i); },[fetchBookings]);

  function showToast(m){ setToast(m); setTimeout(()=>setToast(null),3500); }
  function handleLogin(){
    const c=COACHES.find(c=>c.name.toLowerCase()===loginName.trim().toLowerCase()&&c.pin===loginPin);
    if(c){ setCoach(c); setLoginErr(""); setShowLogin(false); setView("pitches"); } else setLoginErr("Name or PIN not recognised.");
  }
  function handleLogout(){ setCoach(null); setView("schedule"); }
  function isBooked(pid,half,dk,t){
    if(bookings[slotKey(pid,"full",dk,t)]) return true;
    if(half==="full") return !!(bookings[slotKey(pid,"north",dk,t)]||bookings[slotKey(pid,"south",dk,t)]);
    return !!bookings[slotKey(pid,half,dk,t)];
  }
  function getSlots(pid,half,dk,t,dur){ const idx=TIMES.indexOf(t); return TIMES.slice(idx,idx+getDurationSlots(dur)); }
  function isAvailable(pid,half,dk,t,dur){ const slots=getSlots(pid,half,dk,t,dur); return slots.length>0&&slots.every(s=>!isBooked(pid,half,dk,s)); }
  function getBlockDates(startDate,weeks){ return Array.from({length:weeks},(_,i)=>{ const d=new Date(startDate); d.setDate(d.getDate()+i*7); return d; }); }

  async function handleBook(){
    if(!selPitch||!selDate||!selTime||!coach) return;
    setSaving(true);
    const dates=blockBook?getBlockDates(selDate,blockWeeks):[selDate];
    let booked=0,skipped=0; const bookedDates=[];
    for(const date of dates){
      const dk=getDateKey(date);
      const slots=getSlots(selPitch,selHalf,dk,selTime,selDur);
      const allFree=slots.every(t=>!isBooked(selPitch,selHalf,dk,t));
      if(allFree){
        for(let i=0;i<slots.length;i++){
          const t=slots[i];
          await upsertBooking({ slot_key:slotKey(selPitch,selHalf,dk,t), pitch_id:selPitch, half:selHalf, date_key:dk, time_slot:t, coach_id:coach.id, coach_name:coach.name, group_name:coach.role, duration:selDur, start_time:selTime, continuation:i>0 });
        }
        bookedDates.push(date); booked++;
      } else skipped++;
    }
    await fetchBookings(); setSaving(false);
    const pn=PITCHES.find(p=>p.id===selPitch)?.name;
    showToast(blockBook?`Block booked! ${booked} session${booked!==1?"s":""}${skipped>0?` (${skipped} skipped)`:""}`:`Booked! ${pn} · ${selDate.toLocaleDateString("en-IE")} · ${selTime}`);
    if(bookedDates.length>0) setCalPrompt({dates:bookedDates,pitchName:pn,half:selHalf,time:selTime,dur:selDur,coachName:coach.name});
    setView("schedule"); setSelTime(null); setBlockBook(false);
  }

  async function confirmCancel(){
    const key=confirmModal; const b=bookings[key]; if(!b){setConfirmModal(null);return;}
    setSaving(true);
    const[pid,half,dk]=key.split("|");
    const slots=getSlots(pid,half,dk,b.time,b.duration||"1 hour");
    for(const t of slots) await deleteBooking(slotKey(pid,half,dk,t));
    await fetchBookings(); setSaving(false); setConfirmModal(null); showToast("Booking cancelled.");
  }

  function buildICSDate(date,time){ const [h,m]=time.split(":").map(Number); const d=new Date(date); d.setHours(h,m,0,0); return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,""); }
  function buildICSEnd(date,time,dur){ const [h,m]=time.split(":").map(Number); const d=new Date(date); const mins=dur==="30 mins"?30:dur==="1 hour"?60:dur==="1.5 hours"?90:120; d.setHours(h,m+mins,0,0); return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,""); }
  function downloadICS(dates,pitchName,half,time,dur,coachName){
    const hl=half==="full"?"Full Pitch":half==="north"?"North Half":"South Half";
    const events=dates.map(date=>["BEGIN:VEVENT",`DTSTART:${buildICSDate(date,time)}`,`DTEND:${buildICSEnd(date,time,dur)}`,`SUMMARY:${coachName} – ${pitchName} (${hl})`,`DESCRIPTION:Booked by ${coachName}`,`LOCATION:Galbally Pearses GAC`,"STATUS:CONFIRMED","END:VEVENT"].join("\r\n"));
    const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Galbally GAC//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH",...events,"END:VCALENDAR"].join("\r\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar;charset=utf-8"})); a.download="galbally-booking.ics"; a.click();
  }

  const pitch=PITCHES.find(p=>p.id===selPitch);
  const upcoming=Object.entries(bookings).filter(([,v])=>!v.continuation).map(([k,v])=>{ const[pid,half,dk]=k.split("|"); return{key:k,pitchId:pid,half,dateKey:dk,...v}; }).filter(b=>b.dateKey>=getDateKey(today)).sort((a,b)=>a.dateKey.localeCompare(b.dateKey)||a.time.localeCompare(b.time));

  const ScheduleView = () => (
    <div className="fade-in">
      <div style={S.pageTitle}>
        <h1 style={S.h1t}>Pitch Schedule</h1>
        <p style={{color:"#475569",fontSize:13,margin:0}}>{upcoming.length} upcoming booking{upcoming.length!==1?"s":""}</p>
      </div>
      {dbError&&<div style={S.errBanner}>⚠️ Could not connect. <button style={S.retryBtn} onClick={fetchBookings}>Retry</button></div>}
      <section style={S.section}>
        <div style={S.weekNav}>
          <button style={S.weekBtn} onClick={()=>setWeekOffset(w=>w-1)} disabled={weekOffset<=0}>‹</button>
          <span style={S.weekLabel}>{week[0].toLocaleDateString("en-IE",{day:"numeric",month:"short"})} – {week[6].toLocaleDateString("en-IE",{day:"numeric",month:"short",year:"numeric"})}</span>
          <button style={S.weekBtn} onClick={()=>setWeekOffset(w=>w+1)}>›</button>
        </div>
        {loading
          ?<div style={S.loadingWrap}><div style={S.spinner}/><span style={{color:"#64748b",fontSize:13}}>Loading…</span></div>
          :<div style={S.schedGrid}>
            {week.map((d,di)=>{
              const dk=getDateKey(d),isPast=d<new Date(getDateKey(today)),isToday=getDateKey(d)===getDateKey(today);
              const dayB=PITCHES.flatMap(p=>TIMES.filter(t=>{ const b=bookings[slotKey(p.id,"full",dk,t)]||bookings[slotKey(p.id,"north",dk,t)]||bookings[slotKey(p.id,"south",dk,t)]; return b&&b.time===t&&!b.continuation; }).map(t=>{ const fk=slotKey(p.id,"full",dk,t),nk=slotKey(p.id,"north",dk,t),sk2=slotKey(p.id,"south",dk,t); const bk=bookings[fk]||bookings[nk]||bookings[sk2]; const key=bookings[fk]?fk:bookings[nk]?nk:sk2; return{pitch:p,time:t,key,...bk}; })).sort((a,b)=>a.time.localeCompare(b.time));
              return (
                <div key={di} style={{...S.schedDay,...(isPast?{opacity:0.45}:{}),...(isToday?S.schedDayToday:{})}}>
                  <div style={{...S.schedDayHdr,...(isToday?S.schedDayHdrToday:{})}}>
                    <div style={{...S.schedDayName,...(isToday?{color:"#fff"}:{})}}>{DAY_NAMES[di]}</div>
                    <div style={{...S.schedDayNum,...(isToday?{color:"#fff"}:{})}}>{d.getDate()}</div>
                  </div>
                  {dayB.length===0?<div style={S.noB}>Free</div>:dayB.map(b=>{ const isC=b.pitch.id==="committee"; return (
                    <div key={b.key} style={{...S.chip,borderLeftColor:isC?"#ea580c":"#1d4ed8",background:isC?"#fff7ed":"#eff6ff"}}>
                      <div style={S.chipTime}>{b.time}</div>
                      <div style={S.chipPitch}>{b.pitch.name==="Committee Room"?"Comm.":b.pitch.name}</div>
                      <div style={S.chipMeta}>{b.half==="full"?"Full":b.half==="north"?"N½":"S½"} · {b.coachName?.split(" ")[0]}</div>
                      {coach&&<button style={S.cancelXBtn} onClick={()=>setConfirmModal(b.key)}>✕</button>}
                    </div>
                  ); })}
                </div>
              );
            })}
          </div>
        }
      </section>
      {!loading&&upcoming.length>0&&(
        <section style={S.section}>
          <div style={S.sLabel}><span style={S.stepNum}>↓</span> All Upcoming Bookings</div>
          <div style={S.bList}>
            {upcoming.map(b=>{ const p=PITCHES.find(x=>x.id===b.pitchId); const isC=p?.id==="committee"; return (
              <div key={b.key} style={{...S.bRow,borderLeftColor:isC?"#ea580c":"#1d4ed8"}}>
                <div style={S.bRowLeft}>
                  <div style={S.bDate}>{new Date(b.dateKey+"T12:00:00").toLocaleDateString("en-IE",{weekday:"short",day:"numeric",month:"short"})}</div>
                  <div style={S.bTime}>{b.time} · {b.duration}</div>
                  <div style={S.bPitch}>{p?.name} · <span style={{color:isC?"#ea580c":"#1d4ed8",fontWeight:600}}>{isC?"Whole Room":b.half==="full"?"Full":b.half==="north"?"North Half":"South Half"}</span></div>
                </div>
                <div style={S.bRowRight}>
                  <div style={S.bCoach}>{b.coachName}</div>
                  <div style={S.bGroup}>{b.group}</div>
                  {coach&&<button style={S.cancelFullBtn} onClick={()=>setConfirmModal(b.key)}>Cancel</button>}
                </div>
              </div>
            ); })}
          </div>
        </section>
      )}
    </div>
  );

  const LoginModal = () => (
    <div style={S.overlay}>
      <div style={S.loginCard} className="fade-in">
        <h1 style={S.loginClub}>Galbally Pearses GAC</h1>
        <div style={S.loginDivider}/>
        <p style={S.loginSystem}>Coach / Admin Sign In</p>
        <div style={S.formGroup}><label style={S.label}>Name</label><input style={S.input} placeholder="e.g. Senior Mens" value={loginName} onChange={e=>setLoginName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
        <div style={S.formGroup}><label style={S.label}>PIN</label><input style={S.input} type="password" placeholder="••••" maxLength={6} value={loginPin} onChange={e=>setLoginPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
        {loginErr&&<div style={S.loginErr}>{loginErr}</div>}
        <button style={S.loginBtn} onClick={handleLogin}>Sign In →</button>
        <button style={S.cancelLoginBtn} onClick={()=>{setShowLogin(false);setLoginErr("");}}>Cancel</button>
        <div style={S.loginHint}>Contact your club admin if you need access</div>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{css}</style>
      {showLogin&&<LoginModal/>}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}><div style={S.logoTitle}>Galbally Pearses GAC</div><div style={S.logoSub}>Facility Booking System</div></div>
          <nav style={S.nav}>
            <button style={{...S.navBtn,...(view==="schedule"?S.navBtnActive:{})}} onClick={()=>setView("schedule")}>Schedule</button>
            {coach&&<><button style={{...S.navBtn,...(view==="pitches"?S.navBtnActive:{})}} onClick={()=>setView("pitches")}>Pitches & Rooms</button><button style={{...S.navBtn,...(view==="book"?S.navBtnActive:{})}} onClick={()=>setView("book")}>Book</button></>}
            {coach?<button style={S.coachPill} onClick={()=>{if(window.confirm(`Sign out ${coach.name}?`))handleLogout();}}>👤 {coach.name.split(" ")[0]} ✕</button>:<button style={S.signInBtn} onClick={()=>{setLoginErr("");setShowLogin(true);}}>🔒 Coach Sign In</button>}
          </nav>
        </div>
      </header>
      <main style={S.main}>
        {saving&&<div style={S.savingBar}>⏳ Saving…</div>}
        {view==="schedule"&&<ScheduleView/>}
        {view==="pitches"&&coach&&(
          <div className="fade-in">
            <div style={S.pageHero}><div><h1 style={S.h1}>Facilities</h1><p style={S.heroIrish}>Páirc an Phiarsaigh · Galbally Pearses GAC · Est. 1949</p><p style={S.sub}>Select a pitch or room to make a booking</p></div></div>
            <div style={S.facilitySection}>
              <div style={S.facilityHeading}>⚽ Pitches & Training Areas</div>
              <div style={S.pitchGrid}>
                {PITCHES.filter(p=>p.id!=="committee").map((p,i)=>(
                  <div key={p.id} className="pitch-card" style={S.pitchCard}>
                    <div style={{...S.pitchBand,background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)"}}><span style={{fontSize:30}}>{p.icon}</span><div style={{fontSize:30,fontWeight:700,color:"rgba(255,255,255,0.2)"}}>{String(i+1).padStart(2,"0")}</div></div>
                    <div style={S.pitchBody}>
                      <h2 style={S.pitchName}>{p.irishName}</h2><p style={S.pitchIrish}>{p.name}</p><p style={S.pitchDesc}>{p.desc}</p>
                      {p.halfable&&<div style={S.halfTag}>⬛ Half-pitch bookings available</div>}
                      <div style={S.pitchActions}><button style={{...S.bookNowBtn,background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)"}} onClick={()=>{setSelPitch(p.id);setSelHalf("full");setView("book");}}>Book →</button><button style={S.mapBtn} onClick={()=>window.open(p.mapsUrl,"_blank")}>📍 Map</button></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.facilitySection}>
              <div style={S.facilityHeading}>🪑 Meeting Rooms</div>
              <div style={S.pitchGrid}>
                {PITCHES.filter(p=>p.id==="committee").map(p=>(
                  <div key={p.id} className="pitch-card" style={{...S.pitchCard,maxWidth:320}}>
                    <div style={{...S.pitchBand,background:"linear-gradient(135deg,#7c2d12,#ea580c)"}}><span style={{fontSize:30}}>{p.icon}</span><div style={{fontSize:30,fontWeight:700,color:"rgba(255,255,255,0.2)"}}>CM</div></div>
                    <div style={S.pitchBody}>
                      <h2 style={{...S.pitchName,color:"#9a3412"}}>{p.irishName}</h2><p style={S.pitchIrish}>{p.name}</p><p style={S.pitchDesc}>{p.desc}</p>
                      <div style={{...S.halfTag,color:"#9a3412",background:"#fff7ed",border:"1px solid #fed7aa"}}>🪑 Whole room only</div>
                      <div style={S.pitchActions}><button style={{...S.bookNowBtn,background:"linear-gradient(135deg,#7c2d12,#ea580c)"}} onClick={()=>{setSelPitch(p.id);setSelHalf("full");setView("book");}}>Book Room →</button></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {view==="book"&&coach&&(
          <div className="fade-in">
            <div style={S.pageTitle}><h1 style={S.h1t}>Make a Booking</h1><p style={{color:"#475569",fontSize:13}}>Booking as <strong style={{color:"#1d4ed8"}}>{coach.name}</strong> · {coach.role}</p></div>
            <section style={S.section}>
              <div style={S.sLabel}><span style={S.stepNum}>1</span> Select Facility</div>
              <div style={{...S.tabRow,marginBottom:8}}><span style={S.tabGroup}>⚽ Pitches</span>{PITCHES.filter(p=>p.id!=="committee").map(p=>(<button key={p.id} style={{...S.tab,...(selPitch===p.id?S.tabActive:{})}} onClick={()=>{setSelPitch(p.id);setSelHalf("full");setSelTime(null);}}>{p.icon} {p.name}</button>))}</div>
              <div style={S.tabRow}><span style={S.tabGroup}>🪑 Rooms</span><button style={{...S.tab,...(selPitch==="committee"?{...S.tabActive,background:"linear-gradient(135deg,#7c2d12,#ea580c)"}:{})}} onClick={()=>{setSelPitch("committee");setSelHalf("full");setSelTime(null);}}>🪑 Committee Room</button></div>
            </section>
            {selPitch&&pitch?.halfable&&(<section style={S.section}><div style={S.sLabel}><span style={S.stepNum}>1b</span> Pitch Section</div><div style={S.tabRow}>{[["full","⬛ Full Pitch"],["north","⬆ North Half"],["south","⬇ South Half"]].map(([v,lbl])=>(<button key={v} style={{...S.tab,...(selHalf===v?S.tabActive:{})}} onClick={()=>{setSelHalf(v);setSelTime(null);}}>{lbl}</button>))}</div></section>)}
            <section style={S.section}>
              <div style={S.sLabel}><span style={S.stepNum}>2</span> Select Date</div>
              <div style={S.weekNav}><button style={S.weekBtn} onClick={()=>setWeekOffset(w=>w-1)} disabled={weekOffset<=0}>‹</button><span style={S.weekLabel}>{week[0].toLocaleDateString("en-IE",{day:"numeric",month:"short"})} – {week[6].toLocaleDateString("en-IE",{day:"numeric",month:"short",year:"numeric"})}</span><button style={S.weekBtn} onClick={()=>setWeekOffset(w=>w+1)}>›</button></div>
              <div style={S.dateRow}>{week.map((d,i)=>{ const isPast=d<new Date(getDateKey(today)),isSel=selDate&&getDateKey(d)===getDateKey(selDate),isToday=getDateKey(d)===getDateKey(today); return (<button key={i} disabled={isPast} onClick={()=>{setSelDate(d);setSelTime(null);}} style={{...S.dateBtn,...(isSel?S.dateBtnActive:{}),...(isToday&&!isSel?S.dateBtnToday:{}),...(isPast?S.dateBtnPast:{})}}><div style={S.dateDayName}>{DAY_NAMES[i]}</div><div style={S.dateDayNum}>{d.getDate()}</div></button>); })}</div>
            </section>
            {selDate&&selPitch&&(<section style={S.section}>
              <div style={S.sLabel}><span style={S.stepNum}>3</span> Duration & Time</div>
              <div style={S.durRow}>{DURATIONS.map(d=>(<button key={d} style={{...S.durBtn,...(selDur===d?S.durBtnActive:{})}} onClick={()=>{setSelDur(d);setSelTime(null);}}>{d}</button>))}</div>
              <div style={S.timeGrid}>{TIMES.slice(0,TIMES.length-getDurationSlots(selDur)+1).map(t=>{ const dk=getDateKey(selDate),avail=isAvailable(selPitch,selHalf,dk,t,selDur),isSel=selTime===t; return (<button key={t} disabled={!avail} style={{...S.timeBtn,...(isSel?S.timeBtnActive:{}),...(!avail?S.timeBtnTaken:{})}} onClick={()=>setSelTime(t)}>{t}{!avail&&<span style={S.takenBadge}>Taken</span>}</button>); })}</div>
            </section>)}
            {selTime&&(<section style={S.section}>
              <div style={S.sLabel}><span style={S.stepNum}>4</span> Confirm Booking</div>
              <div style={S.blockToggleRow}><div><div style={S.blockToggleTitle}>🔁 Block Booking</div><div style={S.blockToggleSub}>Repeat weekly</div></div><button style={{...S.toggleBtn,...(blockBook?S.toggleBtnOn:{})}} onClick={()=>setBlockBook(b=>!b)}><span style={{...S.toggleKnob,...(blockBook?S.toggleKnobOn:{})}}/></button></div>
              {blockBook&&(<div style={S.blockOptions}>
                <div style={S.blockWeeksLabel}>Weeks:</div>
                <div style={S.blockWeeksRow}>{[1,2,3,4].map(n=>(<button key={n} style={{...S.weekNumBtn,...(blockWeeks===n?S.weekNumBtnActive:{})}} onClick={()=>setBlockWeeks(n)}>{n}w</button>))}</div>
                <div style={S.previewList}>{getBlockDates(selDate,blockWeeks).map((d,i)=>{ const dk=getDateKey(d); const conflict=!getSlots(selPitch,selHalf,dk,selTime,selDur).every(t=>!isBooked(selPitch,selHalf,dk,t)); return (<div key={i} style={{...S.previewItem,...(conflict?S.previewConflict:S.previewOk)}}><span>{conflict?"⚠️":"✅"}</span><span>{d.toLocaleDateString("en-IE",{weekday:"short",day:"numeric",month:"short"})}</span><span style={{marginLeft:"auto",fontSize:11}}>{selTime} · {selDur}</span>{conflict&&<span style={S.conflictBadge}>Conflict</span>}</div>); })}</div>
              </div>)}
              <div style={S.summary}>
                <div style={S.summaryHdr}><div><div style={S.summaryClub}>Galbally Pearses GAC</div><div style={S.summarySubtitle}>{blockBook?`Block · ${blockWeeks}w`:"Confirmation"}</div></div></div>
                <div style={S.summaryGrid}>{[["Coach",coach.name],["Group",coach.role],["Facility",pitch?.name],["Section",selPitch==="committee"?"Whole Room":selHalf==="full"?"Full Pitch":selHalf==="north"?"North Half":"South Half"],["Date",selDate?.toLocaleDateString("en-IE",{weekday:"short",day:"numeric",month:"long"})],["Time",selTime],["Duration",selDur]].map(([k,v])=>(<div key={k} style={S.summaryItem}><span style={S.summaryKey}>{k}</span><span style={S.summaryVal}>{v}</span></div>))}</div>
              </div>
              <button style={{...S.bookBtn,background:selPitch==="committee"?"linear-gradient(135deg,#7c2d12,#ea580c)":"linear-gradient(135deg,#1e3a8a,#1d4ed8)",opacity:saving?0.6:1}} onClick={handleBook} disabled={saving}>{saving?"⏳ Saving…":blockBook?`✔ Confirm Block (${blockWeeks}w)`:"✔ Confirm Booking"}</button>
            </section>)}
          </div>
        )}
      </main>
      {calPrompt&&(<div style={S.overlay}><div style={S.modal} className="fade-in"><div style={{fontSize:36,marginBottom:6}}>📅</div><div style={S.modalTitle}>Add to Calendar?</div><p style={S.modalText}>Download a .ics file for Apple Calendar, Google Calendar or Outlook.</p><div style={S.modalBtns}><button style={S.modalKeep} onClick={()=>setCalPrompt(null)}>No Thanks</button><button style={{...S.modalDel,background:"#eff6ff",borderColor:"#bfdbfe",color:"#1e3a8a"}} onClick={()=>{downloadICS(calPrompt.dates,calPrompt.pitchName,calPrompt.half,calPrompt.time,calPrompt.dur,calPrompt.coachName);setCalPrompt(null);}}>📥 Download .ics</button></div></div></div>)}
      {confirmModal&&(<div style={S.overlay}><div style={S.modal} className="fade-in"><div style={S.modalTitle}>Cancel Booking?</div><p style={S.modalText}>This will free the slot for other coaches.</p><div style={S.modalBtns}><button style={S.modalKeep} onClick={()=>setConfirmModal(null)}>Keep It</button><button style={{...S.modalDel,opacity:saving?0.6:1}} onClick={confirmCancel} disabled={saving}>{saving?"Cancelling…":"Yes, Cancel"}</button></div></div></div>)}
      {toast&&<div style={S.toast} className="toast-in">✅ {toast}</div>}
    </div>
  );
}

const BLUE="#1d4ed8",DKBLUE="#1e3a8a";
const S={
  root:{minHeight:"100vh",background:"#eff6ff",color:"#0f172a",fontFamily:"'Georgia',serif"},
  header:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(30,58,138,0.4)"},
  headerInner:{maxWidth:1160,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,flexWrap:"wrap",gap:6},
  logo:{display:"flex",flexDirection:"column",justifyContent:"center"},
  logoTitle:{fontSize:16,fontWeight:700,color:"#fff"},
  logoSub:{fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:"0.5px"},
  nav:{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"},
  navBtn:{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.85)",padding:"7px 15px",borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  navBtnActive:{background:"rgba(255,255,255,0.95)",borderColor:"transparent",color:DKBLUE,fontWeight:700},
  coachPill:{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",color:"rgba(255,255,255,0.9)",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit"},
  signInBtn:{background:"rgba(255,255,255,0.95)",border:"none",color:DKBLUE,padding:"7px 14px",borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700},
  main:{maxWidth:1160,margin:"0 auto",padding:"32px 20px 70px"},
  savingBar:{background:"#dbeafe",border:"1px solid #bfdbfe",borderRadius:8,padding:"8px 14px",marginBottom:14,fontSize:13,color:DKBLUE,textAlign:"center"},
  errBanner:{background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:8,padding:"8px 14px",marginBottom:14,fontSize:13,color:"#92400e",display:"flex",alignItems:"center",gap:10},
  retryBtn:{background:"#f59e0b",border:"none",color:"#fff",padding:"4px 12px",borderRadius:6,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  loadingWrap:{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"40px 0"},
  spinner:{width:24,height:24,border:"3px solid #bfdbfe",borderTop:`3px solid ${BLUE}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"},
  pageHero:{display:"flex",alignItems:"center",gap:20,marginBottom:28,background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderRadius:18,padding:"22px 28px",boxShadow:"0 8px 32px rgba(30,58,138,0.3)"},
  h1:{fontSize:28,fontWeight:700,color:"#fff",margin:"0 0 4px",letterSpacing:"-0.5px"},
  h1t:{fontSize:28,fontWeight:700,color:DKBLUE,margin:"0 0 4px",letterSpacing:"-0.5px"},
  heroIrish:{fontSize:12,color:"rgba(255,255,255,0.7)",margin:"0 0 4px",fontStyle:"italic"},
  sub:{color:"rgba(255,255,255,0.75)",fontSize:13,margin:0},
  pageTitle:{marginBottom:24,textAlign:"center"},
  facilitySection:{marginBottom:28},
  facilityHeading:{fontSize:14,fontWeight:700,color:DKBLUE,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.5px",display:"flex",alignItems:"center",gap:8},
  pitchGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:16},
  pitchCard:{background:"#fff",border:"1px solid #bfdbfe",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(30,58,138,0.07)",transition:"transform 0.2s,box-shadow 0.2s"},
  pitchBand:{height:70,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px"},
  pitchBody:{padding:"14px 18px 18px"},
  pitchName:{fontSize:16,fontWeight:700,color:DKBLUE,margin:"0 0 2px"},
  pitchIrish:{fontSize:11,color:"#64748b",margin:"0 0 5px",fontStyle:"italic"},
  pitchDesc:{fontSize:11,color:"#475569",margin:"0 0 8px"},
  halfTag:{fontSize:10,color:BLUE,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:5,padding:"3px 8px",display:"inline-block",marginBottom:12},
  pitchActions:{display:"flex",gap:8,alignItems:"center"},
  bookNowBtn:{border:"none",color:"#fff",padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"},
  mapBtn:{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"inherit"},
  section:{background:"#fff",border:"1px solid #bfdbfe",borderRadius:14,padding:"18px 22px",marginBottom:14,boxShadow:"0 1px 6px rgba(30,58,138,0.05)"},
  sLabel:{fontSize:12,color:DKBLUE,marginBottom:12,fontWeight:700,display:"flex",alignItems:"center",gap:8},
  stepNum:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,color:"#fff",borderRadius:"50%",width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0},
  tabRow:{display:"flex",flexWrap:"wrap",gap:7,alignItems:"center"},
  tabGroup:{fontSize:11,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginRight:4},
  tab:{background:"#eff6ff",border:"1px solid #bfdbfe",color:BLUE,padding:"8px 13px",borderRadius:9,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  tabActive:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderColor:"transparent",color:"#fff",fontWeight:700},
  weekNav:{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12},
  weekBtn:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,border:"none",color:"#fff",width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"},
  weekLabel:{color:DKBLUE,fontSize:13,minWidth:210,textAlign:"center",fontWeight:600},
  dateRow:{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"},
  dateBtn:{background:"#eff6ff",border:"1px solid #bfdbfe",color:BLUE,borderRadius:9,padding:"8px 10px",cursor:"pointer",minWidth:50,textAlign:"center"},
  dateBtnActive:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderColor:"transparent",color:"#fff"},
  dateBtnToday:{borderColor:BLUE,borderWidth:2},
  dateBtnPast:{opacity:0.3,cursor:"default"},
  dateDayName:{fontSize:9,color:"inherit",textTransform:"uppercase",letterSpacing:"0.5px",opacity:0.75},
  dateDayNum:{fontSize:17,fontWeight:700,marginTop:1},
  durRow:{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"},
  durBtn:{background:"#eff6ff",border:"1px solid #bfdbfe",color:BLUE,padding:"7px 13px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  durBtnActive:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderColor:"transparent",color:"#fff",fontWeight:700},
  timeGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))",gap:6},
  timeBtn:{background:"#eff6ff",border:"1px solid #bfdbfe",color:DKBLUE,padding:"9px 4px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",textAlign:"center"},
  timeBtnActive:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderColor:"transparent",color:"#fff",fontWeight:700},
  timeBtnTaken:{background:"#f1f5f9",color:"#94a3b8",opacity:0.6,cursor:"default",textDecoration:"line-through"},
  takenBadge:{display:"block",fontSize:9,color:"#dc2626",textDecoration:"none"},
  blockToggleRow:{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px 16px",marginBottom:12},
  blockToggleTitle:{fontSize:13,fontWeight:700,color:DKBLUE},
  blockToggleSub:{fontSize:11,color:"#64748b"},
  toggleBtn:{width:44,height:24,borderRadius:12,background:"#cbd5e1",border:"none",cursor:"pointer",position:"relative",flexShrink:0},
  toggleBtnOn:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`},
  toggleKnob:{position:"absolute",top:2,left:2,width:20,height:20,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",display:"block"},
  toggleKnobOn:{left:22},
  blockOptions:{background:"#f8faff",border:"1px solid #dbeafe",borderRadius:10,padding:"14px 16px",marginBottom:12},
  blockWeeksLabel:{fontSize:11,fontWeight:700,color:DKBLUE,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.5px"},
  blockWeeksRow:{display:"flex",gap:7,marginBottom:12},
  weekNumBtn:{background:"white",border:"1px solid #bfdbfe",color:BLUE,padding:"7px 13px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"},
  weekNumBtnActive:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderColor:"transparent",color:"white",fontWeight:700},
  previewList:{display:"flex",flexDirection:"column",gap:5},
  previewItem:{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,fontSize:12,flexWrap:"wrap"},
  previewOk:{background:"#eff6ff",border:"1px solid #bfdbfe",color:DKBLUE},
  previewConflict:{background:"#fff7ed",border:"1px solid #fed7aa",color:"#9a3412"},
  conflictBadge:{background:"#fee2e2",color:"#dc2626",fontSize:10,padding:"2px 7px",borderRadius:9,fontWeight:700},
  summary:{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"14px 18px",marginBottom:14},
  summaryHdr:{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:"1px solid #bfdbfe"},
  summaryClub:{fontSize:13,fontWeight:700,color:DKBLUE},
  summarySubtitle:{fontSize:11,color:"#64748b"},
  summaryGrid:{display:"flex",flexWrap:"wrap",gap:"10px 22px"},
  summaryItem:{display:"flex",flexDirection:"column",gap:1},
  summaryKey:{fontSize:9,color:BLUE,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700},
  summaryVal:{fontSize:13,color:"#0f172a",fontWeight:600},
  bookBtn:{border:"none",color:"#fff",padding:"14px 32px",borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"inherit",display:"block",width:"100%"},
  schedGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5},
  schedDay:{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"6px 5px",minWidth:0},
  schedDayToday:{border:`2px solid ${BLUE}`},
  schedDayHdr:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:5,paddingBottom:4,borderBottom:"1px solid #bfdbfe"},
  schedDayHdrToday:{background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,borderRadius:5,padding:"2px 4px",borderBottom:"none"},
  schedDayName:{fontSize:9,color:BLUE,textTransform:"uppercase",letterSpacing:"0.4px",fontWeight:700,lineHeight:1.2},
  schedDayNum:{fontSize:15,fontWeight:700,color:DKBLUE,lineHeight:1},
  noB:{fontSize:9,color:"#bfdbfe",textAlign:"center",padding:"6px 0"},
  chip:{borderLeft:"3px solid",borderRadius:"0 5px 5px 0",padding:"4px 5px",marginBottom:3,position:"relative",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"},
  chipTime:{fontSize:9,fontWeight:700,color:DKBLUE,lineHeight:1.2},
  chipPitch:{fontSize:8,color:"#475569",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  chipMeta:{fontSize:8,color:"#64748b",lineHeight:1.2},
  cancelXBtn:{position:"absolute",top:2,right:2,background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:8,padding:1,lineHeight:1},
  bList:{display:"flex",flexDirection:"column",gap:9},
  bRow:{background:"#eff6ff",borderLeft:"4px solid",borderRadius:"0 10px 10px 0",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8},
  bRowLeft:{display:"flex",flexDirection:"column",gap:2},
  bDate:{fontSize:13,fontWeight:700,color:DKBLUE},
  bTime:{fontSize:11,color:BLUE},
  bPitch:{fontSize:11,color:"#475569"},
  bRowRight:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3},
  bCoach:{fontSize:12,fontWeight:700,color:"#0f172a"},
  bGroup:{fontSize:10,color:"#64748b"},
  cancelFullBtn:{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:"inherit"},
  formGroup:{marginBottom:14,textAlign:"left"},
  label:{display:"block",fontSize:10,color:DKBLUE,marginBottom:5,letterSpacing:"0.5px",textTransform:"uppercase",fontWeight:700},
  input:{width:"100%",background:"#eff6ff",border:"1px solid #bfdbfe",color:"#0f172a",padding:"11px 13px",borderRadius:9,fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"},
  overlay:{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200},
  loginCard:{background:"#fff",borderRadius:20,padding:"36px 36px 28px",width:360,textAlign:"center",boxShadow:"0 30px 80px rgba(0,0,0,0.35)"},
  loginClub:{fontSize:19,fontWeight:700,color:DKBLUE,margin:"0 0 6px"},
  loginDivider:{height:2,background:"linear-gradient(90deg,transparent,#1d4ed8,transparent)",margin:"8px auto 14px",width:160},
  loginSystem:{fontSize:12,color:"#64748b",marginBottom:18},
  loginErr:{color:"#dc2626",fontSize:12,marginBottom:8,background:"#fef2f2",padding:"7px 10px",borderRadius:8,border:"1px solid #fecaca"},
  loginBtn:{width:"100%",background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,border:"none",color:"#fff",padding:"13px",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"inherit",marginTop:8},
  cancelLoginBtn:{width:"100%",background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",padding:"10px",borderRadius:12,cursor:"pointer",fontSize:14,fontFamily:"inherit",marginTop:8},
  loginHint:{fontSize:11,color:"#94a3b8",marginTop:12},
  modal:{background:"#fff",border:"1px solid #bfdbfe",borderRadius:18,padding:"28px",maxWidth:340,width:"90%",textAlign:"center",boxShadow:"0 20px 60px rgba(30,58,138,0.25)"},
  modalTitle:{fontSize:18,fontWeight:700,color:DKBLUE,margin:"0 0 7px"},
  modalText:{color:"#64748b",marginBottom:20,fontSize:13},
  modalBtns:{display:"flex",gap:10,justifyContent:"center"},
  modalKeep:{background:"#eff6ff",border:"1px solid #bfdbfe",color:DKBLUE,padding:"10px 20px",borderRadius:9,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600},
  modalDel:{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 20px",borderRadius:9,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600},
  toast:{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(135deg,${DKBLUE},${BLUE})`,color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 8px 32px rgba(30,58,138,0.4)",zIndex:1000,whiteSpace:"nowrap"},
};
const css=`
  *{box-sizing:border-box;}body{margin:0;background:#eff6ff;}
  .fade-in{animation:fadeIn 0.3s ease both;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .toast-in{animation:toastIn 0.3s ease both;}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(12px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  .pitch-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(30,58,138,0.15) !important;}
  input:focus{border-color:#1d4ed8 !important;box-shadow:0 0 0 3px rgba(29,78,216,0.15) !important;}
`;
