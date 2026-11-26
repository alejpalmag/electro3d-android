import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import './styles.css';

type Kind = 'breaker'|'contactor'|'thermal'|'stop'|'start'|'pilot'|'motor'|'relay'|'terminal';
type Terminal = { id:string; label:string; x:number; y:number };
type Component = {
  id:string; kind:Kind; name:string; x:number; y:number;
  terminals:Terminal[]; state?:boolean; trip?:boolean;
};
type Wire = { id:string; a:string; b:string };
type Project = { version:string; components:Component[]; wires:Wire[] };

const catalog: {kind:Kind; label:string; icon:string}[] = [
  {kind:'breaker',label:'QF1 Interruptor',icon:'⏻'},
  {kind:'contactor',label:'KM1 Contactor',icon:'▣'},
  {kind:'thermal',label:'FR1 Térmico',icon:'♨'},
  {kind:'stop',label:'S0 Parada NC',icon:'■'},
  {kind:'start',label:'S1 Marcha NO',icon:'●'},
  {kind:'pilot',label:'H1 Piloto',icon:'●'},
  {kind:'motor',label:'M1 Motor 3~',icon:'M'},
  {kind:'relay',label:'K1 Relé',icon:'R'},
  {kind:'terminal',label:'X1 Bornera',icon:'⌗'}
];

function terminalsFor(kind:Kind): Terminal[] {
  if (kind==='motor') return [{id:'T1',label:'U',x:0,y:-18},{id:'T2',label:'V',x:0,y:0},{id:'T3',label:'W',x:0,y:18}];
  if (kind==='contactor') return [{id:'A1',label:'A1',x:-42,y:-16},{id:'A2',label:'A2',x:-42,y:16},{id:'13',label:'13',x:42,y:-16},{id:'14',label:'14',x:42,y:16},{id:'21',label:'21',x:42,y:34},{id:'22',label:'22',x:42,y:50}];
  return [{id:'1',label:'1',x:-42,y:0},{id:'2',label:'2',x:42,y:0}];
}

function makeComponent(kind:Kind, n:number, x:number, y:number):Component {
  const labels:Record<Kind,string> = {breaker:'QF',contactor:'KM',thermal:'FR',stop:'S',start:'S',pilot:'H',motor:'M',relay:'K',terminal:'X'};
  const name = labels[kind] + n;
  return {id:crypto.randomUUID(),kind,name,x,y,terminals:terminalsFor(kind),state:false,trip:false};
}

const initial:Project = {
  version:'1.0-android',
  components:[
    {...makeComponent('breaker',1,100,80)},
    {...makeComponent('stop',0,250,80),name:'S0'},
    {...makeComponent('start',1,390,80),name:'S1'},
    {...makeComponent('contactor',1,540,80)},
    {...makeComponent('thermal',1,700,80)},
    {...makeComponent('motor',1,820,180)},
    {...makeComponent('pilot',1,540,210)},
  ],
  wires:[]
};

function App(){
  const [project,setProject] = useState<Project>(() => {
    try { return JSON.parse(localStorage.getItem('electro3d-project')||'null') || initial; } catch { return initial; }
  });
  const [selected,setSelected] = useState<string|null>(null);
  const [wireStart,setWireStart] = useState<string|null>(null);
  const [running,setRunning] = useState(false);
  const [message,setMessage] = useState('Listo para diseñar');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tab,setTab] = useState<'design'|'sim'|'3d'>('design');

  const sel = project.components.find(c=>c.id===selected);

  useEffect(()=>localStorage.setItem('electro3d-project',JSON.stringify(project)),[project]);

  const counts = useMemo(()=>project.components.reduce((a,c)=>(a[c.kind]=(a[c.kind]||0)+1,a),{} as Record<string,number>),[project]);

  function add(kind:Kind){
    const count=(counts[kind]||0)+1;
    const c=makeComponent(kind,count,120+(count%4)*150,130+Math.floor(count/4)*110);
    if(kind==='stop') c.name='S0';
    if(kind==='start') c.name='S1';
    setProject(p=>({...p,components:[...p.components,c]}));
    setSelected(c.id); setMessage(`${c.name} agregado`);
  }
  function move(id:string,x:number,y:number){
    setProject(p=>({...p,components:p.components.map(c=>c.id===id?{...c,x,y}:c)}));
  }
  function terminalKey(c:Component,t:Terminal){ return `${c.id}:${t.id}`; }
  function connect(c:Component,t:Terminal){
    const key=terminalKey(c,t);
    if(!wireStart){ setWireStart(key); setMessage(`Terminal ${c.name}-${t.label} seleccionado. Toca otro terminal.`); return; }
    if(wireStart!==key){
      const w={id:crypto.randomUUID(),a:wireStart,b:key};
      setProject(p=>({...p,wires:[...p.wires,w]}));
      setMessage('Conexión creada');
    }
    setWireStart(null);
  }
  function toggleRun(){
    setRunning(v=>!v);
    setProject(p=>({...p,components:p.components.map(c=>{
      if(c.kind==='breaker') return {...c,state:!running};
      if(c.kind==='contactor') return {...c,state:!running};
      if(c.kind==='motor') return {...c,state:!running};
      if(c.kind==='pilot') return {...c,state:!running};
      return c;
    })}));
    setMessage(!running?'Simulación en marcha':'Simulación detenida');
  }
  function reset(){
    setRunning(false);
    setProject(p=>({...p,components:p.components.map(c=>({...c,state:false,trip:false}))}));
    setMessage('Simulación reiniciada');
  }
  function save(){ localStorage.setItem('electro3d-project',JSON.stringify(project)); setMessage('Proyecto guardado en el dispositivo'); }
  function exportJson(){
    const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='electro3d-proyecto.json'; a.click(); URL.revokeObjectURL(a.href);
  }
  function deleteSelected(){
    if(!selected) return;
    setProject(p=>({...p,components:p.components.filter(c=>c.id!==selected),wires:p.wires.filter(w=>!w.a.startsWith(selected+':')&&!w.b.startsWith(selected+':'))}));
    setSelected(null); setMessage('Componente eliminado');
  }

  return <div className="app">
    <header className="topbar">
      <div><strong>Electro3D</strong><span className="subtitle">Diseñador y simulador eléctrico</span></div>
      <div className="top-actions">
        <button onClick={save}>Guardar</button><button onClick={exportJson}>JSON</button>
      </div>
    </header>

    <nav className="tabs">
      <button className={tab==='design'?'active':''} onClick={()=>setTab('design')}>⚡ Diseño 2D</button>
      <button className={tab==='sim'?'active':''} onClick={()=>setTab('sim')}>▶ Simulación</button>
      <button className={tab==='3d'?'active':''} onClick={()=>setTab('3d')}>◇ Vista 3D</button>
    </nav>

    {tab==='design' && <div className="workspace">
      <aside className="palette">
        <h3>Componentes</h3>
        {catalog.map(i=><button className="catalog" key={i.kind} onClick={()=>add(i.kind)}><span>{i.icon}</span>{i.label}</button>)}
        <div className="hint">Arrastra un componente. Para cablear: toca un terminal y luego otro.</div>
      </aside>
      <main className="schematic" ref={canvasRef}>
        <div className="grid"/>
        <svg className="wires">
          {project.wires.map(w=>{
            const [ca,ta]=w.a.split(':'); const [cb,tb]=w.b.split(':');
            const a=project.components.find(c=>c.id===ca), b=project.components.find(c=>c.id===cb);
            const aa=a?.terminals.find(t=>t.id===ta), bb=b?.terminals.find(t=>t.id===tb);
            if(!a||!b||!aa||!bb) return null;
            return <line key={w.id} x1={a.x+aa.x} y1={a.y+aa.y} x2={b.x+bb.x} y2={b.y+bb.y} />;
          })}
        </svg>
        {project.components.map(c=><Node key={c.id} c={c} selected={selected===c.id} onSelect={()=>setSelected(c.id)} onMove={(x,y)=>move(c.id,x,y)} onTerminal={(t)=>connect(c,t)}/>)}
        <div className="status">{message} · {project.components.length} componentes · {project.wires.length} conexiones</div>
      </main>
      <aside className="properties">
        <h3>Propiedades</h3>
        {sel ? <>
          <label>Referencia<input value={sel.name} onChange={e=>setProject(p=>({...p,components:p.components.map(c=>c.id===sel.id?{...c,name:e.target.value}:c)}))}/></label>
          <label>Tipo<input value={sel.kind} readOnly/></label>
          <label>X<input type="number" value={Math.round(sel.x)} onChange={e=>move(sel.id,+e.target.value,sel.y)}/></label>
          <label>Y<input type="number" value={Math.round(sel.y)} onChange={e=>move(sel.id,sel.x,+e.target.value)}/></label>
          <button className="danger" onClick={deleteSelected}>Eliminar</button>
        </> : <p>Selecciona un componente.</p>}
      </aside>
    </div>}

    {tab==='sim' && <Simulation project={project} running={running} toggleRun={toggleRun} reset={reset} setProject={setProject}/>}
    {tab==='3d' && <ThreeView project={project}/>}

    <footer className="bottom">
      <button onClick={()=>setTab('design')}>Diseño</button>
      <button onClick={toggleRun}>{running?'⏸ Pausar':'▶ Marcha'}</button>
      <button onClick={reset}>↺ Reset</button>
      <span>Electro3D v1.0 Android</span>
    </footer>
  </div>
}

function Node({c,selected,onSelect,onMove,onTerminal}:{c:Component;selected:boolean;onSelect:()=>void;onMove:(x:number,y:number)=>void;onTerminal:(t:Terminal)=>void}){
  const [drag,setDrag]=useState(false); const ref=useRef<HTMLDivElement>(null);
  function down(e:React.PointerEvent){ if((e.target as HTMLElement).classList.contains('terminal')) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDrag(true); onSelect(); }
  function move(e:React.PointerEvent){ if(!drag) return; const rect=ref.current?.parentElement?.getBoundingClientRect(); if(rect) onMove(Math.max(45,e.clientX-rect.left),Math.max(45,e.clientY-rect.top));}
  return <div ref={ref} className={`node ${c.kind} ${selected?'selected':''} ${c.state?'energized':''}`} style={{left:c.x,top:c.y}} onPointerDown={down} onPointerMove={move} onPointerUp={()=>setDrag(false)}>
    <div className="node-title">{c.name}</div>
    <div className="symbol">{c.kind==='motor'?'M':c.kind==='contactor'?'KM':c.kind==='breaker'?'QF':c.kind==='thermal'?'FR':c.kind==='pilot'?'●':c.kind==='start'?'NO':c.kind==='stop'?'NC':c.kind==='relay'?'K':'X'}</div>
    {c.terminals.map(t=><button key={t.id} className="terminal" style={{left:t.x,top:t.y}} onPointerDown={e=>{e.stopPropagation();onTerminal(t)}}>{t.label}</button>)}
  </div>
}

function Simulation({project,running,toggleRun,reset,setProject}:{project:Project;running:boolean;toggleRun:()=>void;reset:()=>void;setProject:React.Dispatch<React.SetStateAction<Project>>}){
  const breaker=project.components.find(c=>c.kind==='breaker');
  const contactor=project.components.find(c=>c.kind==='contactor');
  const thermal=project.components.find(c=>c.kind==='thermal');
  const motor=project.components.find(c=>c.kind==='motor');
  return <section className="sim">
    <div className="sim-head"><h2>Laboratorio de simulación</h2><div><button className="primary" onClick={toggleRun}>{running?'⏸ Pausar':'▶ Marcha'}</button><button onClick={reset}>↺ Reset</button></div></div>
    <div className="cards">
      <Card name="QF1 Interruptor" on={!!breaker?.state} action={()=>setProject(p=>({...p,components:p.components.map(c=>c.kind==='breaker'?{...c,state:!c.state}:c)}))}/>
      <Card name="KM1 Contactor" on={!!contactor?.state}/>
      <Card name="FR1 Térmico" on={!thermal?.trip} action={()=>setProject(p=>({...p,components:p.components.map(c=>c.kind==='thermal'?{...c,trip:!c.trip}:c)}))} fault={!!thermal?.trip}/>
      <Card name="M1 Motor 3~" on={!!motor?.state}/>
    </div>
    <div className="diagnostics"><h3>Diagnóstico</h3>
      <p>{!breaker?.state?'🔴 QF1 abierto: circuito de fuerza sin tensión.':thermal?.trip?'🟠 FR1 disparado: revisar sobrecarga.':running?'🟢 Simulación activa: contactor y motor en estado energizado.':'⚪ Circuito detenido. Pulsa Marcha para probar.'}</p>
      <p>El motor, contactor y piloto están enlazados al estado de simulación de esta versión integrada.</p>
    </div>
  </section>
}
function Card({name,on,action,fault}:{name:string;on:boolean;action?:()=>void;fault?:boolean}){
  return <button className={`simcard ${on?'on':''} ${fault?'fault':''}`} onClick={action}><b>{name}</b><span>{fault?'DISPARADO':on?'ACTIVO':'OFF'}</span></button>
}

function ThreeView({project}:{project:Project}){
  const mount=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!mount.current) return;
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x111827);
    const camera=new THREE.PerspectiveCamera(45,1,0.1,100); camera.position.set(5,4,7); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); mount.current.appendChild(renderer.domElement);
    const light=new THREE.DirectionalLight(0xffffff,2); light.position.set(4,7,5); scene.add(light); scene.add(new THREE.AmbientLight(0xffffff,0.8));
    const panel=new THREE.Mesh(new THREE.BoxGeometry(7,0.25,4),new THREE.MeshStandardMaterial({color:0x374151,metalness:.2,roughness:.7})); scene.add(panel);
    const railMat=new THREE.MeshStandardMaterial({color:0x9ca3af,metalness:.8});
    [-1,1].forEach(y=>{const r=new THREE.Mesh(new THREE.BoxGeometry(6.4,.08,.12),railMat);r.position.set(0,y,0.25);scene.add(r);});
    project.components.forEach((c,i)=>{
      const geo=c.kind==='motor'?new THREE.CylinderGeometry(.45,.45,.8,24):new THREE.BoxGeometry(.65,.75,.5);
      const mat=new THREE.MeshStandardMaterial({color:c.state?0x22c55e:0x64748b,metalness:.35,roughness:.45});
      const m=new THREE.Mesh(geo,mat); m.position.set((i%7)-3, c.kind==='motor'?0:0.55, (Math.floor(i/7)-.5)*1.2); if(c.kind==='motor') m.rotation.z=Math.PI/2; scene.add(m);
    });
    let raf=0; const resize=()=>{const w=mount.current?.clientWidth||1,h=mount.current?.clientHeight||1; camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}; resize();
    const loop=()=>{raf=requestAnimationFrame(loop); scene.rotation.y+=0.002; renderer.render(scene,camera)}; loop();
    window.addEventListener('resize',resize);
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);renderer.dispose();mount.current?.removeChild(renderer.domElement)}
  },[project.components.length,project.components.map(c=>c.state).join(',')]);
  return <section className="view3d"><div className="view3d-head"><h2>Tablero 3D</h2><span>{project.components.length} equipos</span></div><div ref={mount} className="three"/></section>
}

createRoot(document.getElementById('root')!).render(<App/>);
