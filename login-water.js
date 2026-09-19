(()=>{
const screen=document.querySelector('[data-screen="login"]'),canvas=document.querySelector('#loginWater');if(!canvas)return;
const ctx=canvas.getContext('2d'),img=new Image(),motion=matchMedia('(prefers-reduced-motion: reduce)');let w=0,h=0,raf=0,active=false;
img.src='assets/crowny-water-body.png';
function resize(){const r=screen.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
function wash(x,y,size,t,opacity){ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.globalAlpha=opacity;
for(let row=0;row<256;row+=2){const dx=Math.sin(row*.06+t*1.1)*size*.016;ctx.drawImage(img,0,row/256*img.height,img.width,img.height*2/256,-size/2+dx,(row/256-.5)*size,size,size*2.2/256)}ctx.restore();}
let last=0;function draw(ms){if(!active)return;if(ms-last<33&&!motion.matches){raf=requestAnimationFrame(draw);return}last=ms;ctx.clearRect(0,0,w,h);const t=motion.matches?0:ms/1000;wash(w*1.10,h*.31,w*1.45,t,.15);wash(-w*.40,h*.84,w*1.65,-t*.8,.22);
if(!motion.matches&&!document.hidden)raf=requestAnimationFrame(draw);}
function sync(){cancelAnimationFrame(raf);active=screen.classList.contains('active')&&img.complete&&img.naturalWidth>0;if(active){resize();raf=requestAnimationFrame(draw)}}
new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['class']});new ResizeObserver(()=>{if(active){resize();if(motion.matches)draw(0)}}).observe(screen);motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);img.onload=sync;
})();
