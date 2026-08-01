const gate=document.getElementById('gate');
const clickBtn=document.getElementById('click-btn');
const card=document.getElementById('card');
const song=document.getElementById('song');
const lyricsBar=document.getElementById('lyrics-bar');
const lyricsLine=document.getElementById('lyrics-line');

const player=document.getElementById('player');
const playBtn=document.getElementById('play-btn');
const iconPlay=document.getElementById('icon-play');
const iconPause=document.getElementById('icon-pause');
const seek=document.getElementById('seek');
const volume=document.getElementById('volume');
const timeCur=document.getElementById('time-cur');
const timeDur=document.getElementById('time-dur');
const trackName=document.getElementById('track-name');
const shuffleBtn=document.getElementById('shuffle-btn');

const TRACKS=[
  {id:'fs',  name:'favorite song PmBata',            mp3:'assets/music/fs.mp3',            lrc:'assets/music/fs.lrc'},
  {id:'haha',name:'HAHA WACO City Morgue',          mp3:'assets/music/haha.mp3',          lrc:'assets/music/haha.lrc'},
  {id:'bitb',name:'boy in the box City Morgue',mp3:'assets/music/boyinthebox.mp3',   lrc:'assets/music/boyinthebox.lrc'},
  {id:'haha',name:'321 blast off PmBata',          mp3:'assets/music/bo.mp3',          lrc:'assets/music/bo.lrc'}
];

let current=TRACKS[Math.floor(Math.random()*TRACKS.length)];
let lines=[];
let ready=false;
let seeking=false;

function parseLrc(raw){
  const out=[];
  const re=/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  raw.split('\n').forEach(row=>{
    const tags=[...row.matchAll(re)];
    if(!tags.length)return;
    const text=row.replace(re,'').trim();
    tags.forEach(t=>{
      const min=parseInt(t[1],10);
      const sec=parseInt(t[2],10);
      const ms=parseInt(t[3].padEnd(3,'0'),10);
      const time=min*60+sec+ms/1000;
      out.push({time,text});
    });
  });
  return out.sort((a,b)=>a.time-b.time);
}

function fixJammedWords(text){
  return text
    .replace(/([a-z\)\.\,\!\?'"])([A-Z])/g,'$1 $2')
    .replace(/\s+/g,' ')
    .trim();
}

async function loadLyricsFor(track){
  try{
    const res=await fetch(track.lrc);
    if(!res.ok)throw new Error('lrc http '+res.status);
    const raw=await res.text();
    const parsed=parseLrc(raw);
    parsed.forEach(l=>l.text=fixJammedWords(l.text));
    return parsed;
  }catch(e){
    console.warn('[lyrics] failed to load', track.lrc, e);
    return [];
  }
}

function fmtTime(s){
  if(!isFinite(s)||s<0)s=0;
  const m=Math.floor(s/60);
  const sec=Math.floor(s%60);
  return m+':'+String(sec).padStart(2,'0');
}

async function loadTrack(track,autoplay){
  current=track;
  trackName.textContent=track.name;
  song.src=track.mp3;
  lines=await loadLyricsFor(track);
  ready=lines.length>0;
  curIdx=-1;
  wordEls=[];
  lyricsLine.innerHTML='';
  if(autoplay){
    song.currentTime=0;
    try{
      await song.play();
      setPlayIcon(true);
      if(ready)lyricsBar.classList.add('show');
      else lyricsBar.classList.remove('show');
    }catch(e){
      console.warn('[audio] play blocked', e);
    }
  }
}

function setPlayIcon(playing){
  iconPlay.style.display=playing?'none':'block';
  iconPause.style.display=playing?'block':'none';
}

function pickRandomTrack(excludeId){
  const pool=TRACKS.filter(t=>t.id!==excludeId);
  return pool[Math.floor(Math.random()*pool.length)]||TRACKS[0];
}

let curIdx=-1;
let wordEls=[];
let wordStarts=[];
let wordEnds=[];

function buildLine(text){
  lyricsLine.innerHTML='';
  wordEls=[];
  const words=text.split(/\s+/).filter(w=>w.length>0);
  words.forEach((w,i)=>{
    const s=document.createElement('span');
    s.className='wd';
    s.innerHTML='<span class="wd-fill">'+w+'</span>'+w;
    lyricsLine.appendChild(s);
    wordEls.push(s);
    if(i<words.length-1)lyricsLine.appendChild(document.createTextNode(' '));
  });
}

function computeWordTiming(start,end,text){
  const words=text.split(/(\s+)/).filter(w=>/\S/.test(w));
  const weights=words.map(w=>Math.max(1,w.length));
  const total=weights.reduce((a,b)=>a+b,0);
  const dur=Math.max(0.3,end-start);
  let t=start;
  const starts=[];
  const ends=[];
  weights.forEach(w=>{
    const seg=(w/total)*dur;
    starts.push(t);
    t+=seg;
    ends.push(t);
  });
  return {starts,ends};
}

function tick(){
  const t=song.currentTime;
  const dur=song.duration||0;

  if(!seeking){
    seek.value=dur>0?(t/dur)*100:0;
    timeCur.textContent=fmtTime(t);
    timeDur.textContent=fmtTime(dur);
  }

  if(lines.length){
    let idx=lines.findIndex((l,i)=>t>=l.time && (i===lines.length-1 || t<lines[i+1].time));

    if(idx!==curIdx){
      curIdx=idx;
      const text=idx>=0?lines[idx].text:'';
      buildLine(text);
      if(idx>=0){
        const start=lines[idx].time;
        const end=idx<lines.length-1?lines[idx+1].time:start+4;
        const timing=computeWordTiming(start,end,text);
        wordStarts=timing.starts;
        wordEnds=timing.ends;
      }
    }

    if(idx>=0 && wordEls.length){
      for(let i=0;i<wordStarts.length;i++){
        const el=wordEls[i];
        const fill=el.querySelector('.wd-fill');
        let pct;
        if(t<wordStarts[i]){
          pct=0;
        }else if(t>=wordEnds[i]){
          pct=100;
        }else{
          pct=((t-wordStarts[i])/(wordEnds[i]-wordStarts[i]))*100;
        }
        fill.style.clipPath='inset(0 '+(100-pct)+'% 0 0)';
        el.classList.toggle('touched',pct>0);
        el.classList.toggle('active',pct>0 && pct<100);
      }
    }
  }
  requestAnimationFrame(tick);
}

playBtn.addEventListener('click',()=>{
  if(song.paused){
    song.play().then(()=>setPlayIcon(true)).catch(e=>console.warn(e));
  }else{
    song.pause();
    setPlayIcon(false);
  }
});

seek.addEventListener('input',()=>{
  seeking=true;
  const dur=song.duration||0;
  timeCur.textContent=fmtTime((seek.value/100)*dur);
});

seek.addEventListener('change',()=>{
  const dur=song.duration||0;
  song.currentTime=(seek.value/100)*dur;
  seeking=false;
});

volume.addEventListener('input',()=>{
  song.volume=parseFloat(volume.value);
});

shuffleBtn.addEventListener('click',()=>{
  const next=pickRandomTrack(current.id);
  loadTrack(next,true);
});

song.addEventListener('ended',()=>{
  const next=pickRandomTrack(current.id);
  loadTrack(next,true);
});

let errorSkips=0;
song.addEventListener('error',()=>{
  if(!song.src)return;
  errorSkips++;
  if(errorSkips>TRACKS.length)return;
  console.warn('[audio] failed to load', current.mp3, '- skipping');
  const next=pickRandomTrack(current.id);
  if(next.id!==current.id)loadTrack(next,true);
});

function reveal(){
  gate.classList.add('gone');
  card.classList.add('armed');
  document.body.classList.remove('locked');

  const inner=card.querySelector('.card-inner');
  const probe=inner.cloneNode(true);
  probe.style.position='absolute';
  probe.style.visibility='hidden';
  probe.style.height='auto';
  probe.style.transform='none';
  probe.style.width=card.getBoundingClientRect().width+'px';
  document.body.appendChild(probe);
  const h=probe.scrollHeight;
  document.body.removeChild(probe);
  card.style.setProperty('--card-h', h+'px');

  requestAnimationFrame(()=>{
    card.classList.add('draw-line');
    setTimeout(()=>{
      card.classList.add('expand');
      setTimeout(()=>{
        card.classList.add('reveal');
      },420);
    },450);
  });

  song.volume=parseFloat(volume.value);
  loadTrack(current,true).then(()=>{
    player.classList.add('show');
    requestAnimationFrame(tick);
  });
}

clickBtn.addEventListener('click',()=>{
  reveal();
});

const workEl=document.getElementById('work');
if(workEl){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting)workEl.classList.add('in');
    });
  },{threshold:.15});
  obs.observe(workEl);
}