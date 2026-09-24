let selected,csrf,page=0;
const byId=id=>document.getElementById(id);
async function api(path,options={}){
  const headers=new Headers(options.headers);
  if(options.body && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
  if(options.method && options.method!=='GET') headers.set(csrf.headerName,csrf.token);
  const response=await fetch('/api/v1'+path,{...options,headers});
  if(!response.ok){const error=await response.json().catch(()=>({detail:'Request failed: '+response.status}));throw new Error(error.detail||'Request failed: '+response.status);}
  return response.json();
}
function notice(text){byId('notice').textContent=text;}
async function safe(action){try{notice('');await action();}catch(error){notice(error.message);}}
async function list(reset=true){
  if(reset){page=0;byId('projects').replaceChildren();}
  const result=await api('/projects?page='+page+'&size=20');
  result.content.forEach(project=>{const button=document.createElement('button');button.className='project';button.textContent=project.name;
    const state=document.createElement('small');state.textContent=project.status+' · '+project.pointCount+' points';button.append(state);
    button.onclick=()=>safe(()=>open(project.id));byId('projects').append(button);});
  byId('more').hidden=result.last;page++;
}
async function open(id){
  selected=await api('/projects/'+id);
  byId('empty').hidden=true;byId('detail').hidden=false;
  byId('project-name').textContent=selected.name;byId('project-id').textContent=selected.id;
  byId('status').textContent=selected.status;byId('count').textContent=selected.pointCount;
  byId('rmse').textContent=selected.rmse==null?'—':selected.rmse.toFixed(3)+' m';byId('srid').textContent='EPSG:'+selected.srid;
  byId('approve').disabled=selected.status!=='QA_READY';byId('deliver').disabled=selected.status!=='APPROVED';
  byId('export').href='/api/v1/projects/'+id+'/points.csv';
  const [points,history]=await Promise.all([api('/projects/'+id+'/points'),api('/projects/'+id+'/history')]);
  plot(points);byId('history').replaceChildren();
  history.forEach(event=>{const row=document.createElement('div');row.className='event';const detail=document.createElement('span');
    detail.textContent=event.action+' · '+event.actor;const time=document.createElement('small');time.textContent=new Date(event.occurredAt).toLocaleString();
    row.append(detail,time);byId('history').append(row);});
}
function plot(points){
  const svg=byId('plot');svg.replaceChildren();if(!points.length)return;
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const scale=Math.min(600/(xmax-xmin||1),230/(ymax-ymin||1));
  const width=(xmax-xmin)*scale,height=(ymax-ymin)*scale;
  points.forEach(p=>{const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',(700-width)/2+(p.x-xmin)*scale);
    c.setAttribute('cy',(300+height)/2-(p.y-ymin)*scale);c.setAttribute('r',5);c.setAttribute('fill','#bbef99');
    const title=document.createElementNS(c.namespaceURI,'title');title.textContent=p.id+' · '+p.z+' m';c.append(title);svg.append(c);});
}
byId('create').onsubmit=event=>{event.preventDefault();safe(async()=>{const data=new FormData(event.target);
  const p=await api('/projects',{method:'POST',body:JSON.stringify({name:data.get('name'),srid:Number(data.get('srid'))})});await list();await open(p.id);});};
byId('upload').onsubmit=event=>{event.preventDefault();safe(async()=>{await api('/projects/'+selected.id+'/points?version='+selected.version,{method:'POST',body:new FormData(event.target)});
  await open(selected.id);await list();});};
byId('quality').onsubmit=event=>{event.preventDefault();safe(async()=>{const data=new FormData(event.target);const parse=name=>{
  const text=data.get(name);if(text.split(',').some(v=>v.trim()===''||!Number.isFinite(Number(v))))throw new Error('Enter comma-separated numeric heights');
  return text.split(',').map(Number);};
  const result=await api('/projects/'+selected.id+'/quality',{method:'POST',body:JSON.stringify({version:selected.version,measured:parse('measured'),reference:parse('reference')})});
  await open(selected.id);await list();notice(result.passed?'Quality checks passed':result.issues.join('\n'));});};
for(const action of ['approve','deliver'])byId(action).onclick=()=>safe(async()=>{await api('/projects/'+selected.id+'/'+action,{method:'POST',body:JSON.stringify({version:selected.version})});
  await open(selected.id);await list();});
byId('more').onclick=()=>safe(()=>list(false));
safe(async()=>{csrf=await api('/csrf');await list();});
