function drawMetalCrown(c){
 const outline=()=>{c.beginPath();c.moveTo(-39,22);c.lineTo(-37,-14);c.lineTo(-15,8);c.lineTo(-5,-18);c.lineTo(8,8);c.lineTo(35,-13);c.lineTo(38,22);c.closePath();c.moveTo(-8,-15);c.lineTo(7,2);c.moveTo(7,-15);c.lineTo(-8,2)};
 const gold=c.createLinearGradient(-28,-22,30,26);[[0,'#6a491d'],[.15,'#c59a44'],[.28,'#ffedaa'],[.42,'#b78b38'],[.57,'#e3bd62'],[.72,'#805820'],[.86,'#f4d482'],[1,'#634218']].forEach(([p,v])=>gold.addColorStop(p,v));
 c.lineCap='round';c.lineJoin='round';outline();c.lineWidth=7;c.strokeStyle='#715023';c.stroke();c.lineWidth=5.4;c.strokeStyle=gold;c.stroke();
 c.save();c.translate(-.55,-.75);outline();const light=c.createLinearGradient(-40,-20,40,22);light.addColorStop(0,'#fff4cbaa');light.addColorStop(.4,'#fff1b54d');light.addColorStop(.6,'#fff1b500');light.addColorStop(1,'#fff5d6aa');c.lineWidth=1.25;c.strokeStyle=light;c.stroke();c.restore();
}
const CROWNY_CHARACTER_DEFAULTS={bodySrc:'assets/original-crowned-body.png',gold:'#a1874d',ink:'#1f2924',water:'#195646'};
class CrownyCharacter{
  constructor(canvas,options={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options={...CROWNY_CHARACTER_DEFAULTS,...options};
    this.state=canvas.dataset.state||'rest';this.baseState=this.state;this.start=performance.now();
    this.pointer={down:false,dx:0,dy:0};this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    this.image=new Image();this.image.src=this.options.bodySrc;this.image.onload=()=>{this.ready=true;this.draw(performance.now())};
    this.bind();requestAnimationFrame(t=>this.loop(t));
  }
  bind(){
    this.canvas.addEventListener('pointerdown',e=>{this.pointer.down=true;this.canvas.setPointerCapture?.(e.pointerId);this.trigger('surprise',1150)});
    this.canvas.addEventListener('pointermove',e=>{if(!this.pointer.down)return;const r=this.canvas.getBoundingClientRect();this.pointer.dx=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width/2)));this.pointer.dy=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height/2)));this.state='follow';this.start=performance.now()});
    const up=()=>{if(!this.pointer.down)return;this.pointer.down=false;this.pointer.dx=this.pointer.dy=0;this.trigger('settle',800)};
    this.canvas.addEventListener('pointerup',up);this.canvas.addEventListener('pointercancel',up);
    this.canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.trigger('surprise',1150)}});
  }
  setState(state){this.baseState=state;this.state=state;this.start=performance.now()}
  trigger(state,ms=1400){clearTimeout(this.timer);this.state=state;this.start=performance.now();this.timer=setTimeout(()=>{this.state=this.baseState;this.start=performance.now()},ms)}
  loop(t){if(this.ready)this.draw(t);requestAnimationFrame(x=>this.loop(x))}
  line(points,color=this.options.ink,w=3){const c=this.ctx;c.beginPath();points(c);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()}
  oval(x,y,rx,ry,fill){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill()}
  crown(cx,cy,s=1,rot=0){const c=this.ctx;c.save();c.translate(cx-5,cy+2);c.rotate(rot-.26);c.scale(s,s);drawMetalCrown(c);c.restore()}
  crownMotion(state,t){
    let x=0,y=0,r=0;
    if(state==='surprise'){const p=Math.min(1,t/1.05);y=-42*Math.sin(Math.PI*p);x=8*Math.sin(Math.PI*p);r=.55*Math.sin(Math.PI*p)}
    if(state==='warn'){if(t<.48){const p=t/.48;x=48*p;y=-28+88*p*p;r=1.35*p}else if(t<.9){x=48;y=60;r=1.35}else{const p=Math.min(1,(t-.9)/.45),e=1-Math.pow(1-p,3);x=48*(1-e);y=60*(1-e)-12*Math.sin(Math.PI*p);r=1.35*(1-e)}}
    if(state==='settle')r=Math.sin(t*13)*.12*Math.max(0,1-t/.8);
    return{x,y,r}
  }
  face(cx,cy,state,t){const blink=!this.reduced&&t%4.6>4.42,gx=this.pointer.dx*8,gy=this.pointer.dy*5,closed=blink||['rest','sleep','success'].includes(state);const eye=(x,y)=>closed?this.line(c=>{c.moveTo(x-6,y);c.quadraticCurveTo(x,y+6,x+6,y)},this.options.ink,2.4):this.oval(x+gx,y+gy,3.2,4.5,this.options.ink);eye(cx-14,cy);eye(cx+14,cy);
    if(state==='curious'){const c=this.ctx;c.save();c.fillStyle=this.options.gold;c.font='600 24px sans-serif';c.fillText('?',cx+31,cy-19+Math.sin(t*1.4)*2);c.restore();this.line(c=>{c.moveTo(cx+8,cy-12);c.quadraticCurveTo(cx+14,cy-17,cx+20,cy-13)},this.options.ink,1.6)}
    if(state==='surprise'||state==='warn')this.line(c=>c.ellipse(cx,cy+20,4.5,6,0,0,Math.PI*2),this.options.ink,2);
    else if(!['rest','sleep'].includes(state))this.line(c=>{c.moveTo(cx-7,cy+18);c.quadraticCurveTo(cx,cy+25,cx+7,cy+18)},this.options.ink,2)
  }
  arms(cx,cy,state,t,bodyW){const ctx=this.ctx;ctx.save();ctx.translate(cx,cy);ctx.scale(bodyW/146,bodyW/146);cx=0;cy=0;const wave=Math.sin(t*5);let l=[cx-35,cy+40],r=[cx+35,cy+40];if(state==='greet')r=[cx+79,cy-6-wave*12];if(state==='listen')r=[cx+45,cy+13];if(state==='work'||state==='sync')r=[cx+55+wave*5,cy+41-wave*4];if(state==='search')r=[cx+64,cy+5+wave*3];if(state==='message')r=[cx+65,cy+30];if(state==='success'){l=[cx-66,cy-8];r=[cx+66,cy-8]}if(state==='warn'){l=[cx-60,cy+4];r=[cx+60,cy+4]}
    this.line(c=>{c.moveTo(cx-42,cy+2);c.quadraticCurveTo(cx-62,cy+43,l[0],l[1])},this.options.ink,2.4);this.line(c=>{c.moveTo(cx+42,cy+2);c.quadraticCurveTo(cx+62,cy+43,r[0],r[1])},this.options.ink,2.4);
    if(state==='search')this.line(c=>{c.arc(r[0]+12,r[1]-15,15,0,Math.PI*2);c.moveTo(r[0],r[1]-4);c.lineTo(r[0]-12,r[1]+12)},this.options.gold,3);
    if(state==='work')this.line(c=>{c.moveTo(r[0]-3,r[1]+10);c.lineTo(r[0]+15,r[1]-20)},this.options.gold,4);
    if(state==='message'){const c=this.ctx;c.save();c.translate(r[0]+8,r[1]-15);c.fillStyle='#fffefa';c.strokeStyle=this.options.gold;c.lineWidth=2;c.fillRect(-22,-13,44,28);c.strokeRect(-22,-13,44,28);this.line(p=>{p.moveTo(-22,-13);p.lineTo(0,4);p.lineTo(22,-13)},this.options.gold,1.5);c.restore()}
    ctx.restore();
  }
  ripples(cx,cy,t,strong=false){const c=this.ctx;for(let i=0;i<3;i++){const p=(t*.22+i/3)%1;c.beginPath();c.ellipse(cx,cy,34+p*70,6+p*10,0,0,Math.PI*2);c.strokeStyle=`rgba(25,86,70,${(1-p)*(strong?.28:.13)})`;c.lineWidth=1.5;c.stroke()}}
  caustics(cx,top,w,h,t){
    const c=this.ctx;if(this.reduced)t=0;c.save();
    c.beginPath();c.moveTo(cx,top+h*.26);c.bezierCurveTo(cx+w*.19,top+h*.36,cx+w*.34,top+h*.60,cx+w*.32,top+h*.75);c.bezierCurveTo(cx+w*.30,top+h*.94,cx-w*.30,top+h*.94,cx-w*.32,top+h*.75);c.bezierCurveTo(cx-w*.34,top+h*.60,cx-w*.19,top+h*.36,cx,top+h*.26);c.clip();
    for(let y=h*.25;y<h*.94;y+=1){const dx=Math.sin(y/h*15.36+t*2.8)*w*.021;c.drawImage(this.image,0,y/h*this.image.height,this.image.width,this.image.height/h,cx-w/2+dx,top+y,w,1.2)}
    const sweep=cx+Math.sin(t*.87)*w*.79,g=c.createLinearGradient(sweep-w*.115,top,sweep+w*.115,top+h);g.addColorStop(0,'#ffffff00');g.addColorStop(.5,'#f0fcff99');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(cx-w/2,top,w,h);c.restore()
  }
  draw(now){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);const t=(now-this.start)/1000,state=this.state;let bob=this.reduced?0:Math.sin(t*1.8)*2.5,tilt=0,scale=1;if(state==='follow')tilt=this.pointer.dx*.12;if(state==='surprise'){scale=1+Math.sin(Math.min(1,t/.22)*Math.PI)*.09;bob=-7*Math.sin(Math.min(1,t/.35)*Math.PI)}if(state==='settle')tilt=Math.sin(t*11)*.055*Math.max(0,1-t/.8);if(state==='curious')tilt=-.075+Math.sin(t*1.1)*.015;if(state==='greet')tilt=Math.sin(t*2.6)*.035;if(state==='work')tilt=.05;if(state==='search')tilt=Math.sin(t*1.8)*.045;if(state==='sleep')scale=.94;if(state==='warn')scale=.97+Math.sin(t*12)*.012;
    const cx=w/2,base=h*.84;this.ripples(cx,base+4,t,this.canvas.closest('.splash')!==null);c.save();c.translate(cx,base+bob);c.rotate(tilt);c.scale(scale*1.16,scale);const bodyW=Math.min(w*.54,146),bodyH=bodyW*1.03;c.drawImage(this.image,-bodyW/2,-bodyH,bodyW,bodyH);this.caustics(0,-bodyH,bodyW,bodyH,t);this.face(2,-bodyH*.48,state,t);this.arms(0,-bodyH*.39,state,t,bodyW);const cm=this.crownMotion(state,t);/* Original reference has its crown embedded in the body image. */c.restore()
  }
}
window.CrownyCharacter=CrownyCharacter;
window.CrownyCharacters={instances:[],init(root=document){root.querySelectorAll('canvas.crowny-character').forEach(cv=>{if(!cv._crowny){cv._crowny=new CrownyCharacter(cv);this.instances.push(cv._crowny)}})},setState(id,state){document.querySelector(`#${id}`)?._crowny?.setState(state)}};
