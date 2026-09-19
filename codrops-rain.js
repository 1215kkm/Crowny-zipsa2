/* Adapted from Codrops RainEffect by Lucas Bebber (2015).
Source: https://github.com/codrops/RainEffect
Free integration in personal/commercial projects; do not redistribute the original demo as-is.
CROWNY modifications: manual lifecycle, transparent shader, sanitized UI texture, host drop physics.
See THIRD-PARTY-NOTICES.txt. */
(()=>{
function createCanvas(width,height){
  let canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  return canvas;
}

function random(from=null,to=null,interpolation=null){
  if(from==null){
    from=0;
    to=1;
  }else if(from!=null && to==null){
    to=from;
    from=0;
  }
  const delta=to-from;

  if(interpolation==null){
    interpolation=(n)=>{
      return n;
    }
  }
  return from+(interpolation(Math.random())*delta);
}
function chance(c){
  return random()<=c;
}

function times(n,f){
  for (let i = 0; i < n; i++) {
    f.call(this,i);
  }
}


let dropSize=64;
const Drop={
  x:0,
  y:0,
  r:0,
  spreadX:0,
  spreadY:0,
  momentum:0,
  momentumX:0,
  lastSpawn:0,
  nextSpawn:0,
  parent:null,
  isNew:true,
  killed:false,
  shrink:0,
}
const defaultOptions={
  minR:10,
  maxR:40,
  maxDrops:900,
  rainChance:0.3,
  rainLimit:3,
  dropletsRate:50,
  dropletsSize:[2,4],
  dropletsCleaningRadiusMultiplier:0.43,
  raining:true,
  globalTimeScale:1,
  trailRate:1,
  autoShrink:true,
  spawnArea:[-0.1,0.95],
  trailScaleRange:[0.2,0.5],
  collisionRadius:0.65,
  collisionRadiusIncrease:0.01,
  dropFallMultiplier:1,
  collisionBoostMultiplier:0.05,
  collisionBoost:1,
}

function Raindrops(width,height,scale,dropAlpha,dropColor,options={}){
  this.width=width;
  this.height=height;
  this.scale=scale;
  this.dropAlpha=dropAlpha;
  this.dropColor=dropColor;
  this.options=Object.assign({},defaultOptions,options);
  this.init();
}
Raindrops.prototype={
  dropColor:null,
  dropAlpha:null,
  canvas:null,
  ctx:null,
  width:0,
  height:0,
  scale:0,
  dropletsPixelDensity:1,
  droplets:null,
  dropletsCtx:null,
  dropletsCounter:0,
  drops:null,
  dropsGfx:null,
  clearDropletsGfx:null,
  textureCleaningIterations:0,
  lastRender:null,

  options:null,

  init(){
    this.canvas = createCanvas(this.width,this.height);
    this.ctx = this.canvas.getContext('2d');

    this.droplets = createCanvas(this.width*this.dropletsPixelDensity,this.height*this.dropletsPixelDensity);
    this.dropletsCtx = this.droplets.getContext('2d');

    this.drops=[];
    this.dropsGfx=[];

    this.renderDropsGfx();

    // Driven by the host app animation lifecycle.
  },
  get deltaR(){
    return this.options.maxR-this.options.minR;
  },
  get area(){
    return (this.width*this.height)/this.scale;
  },
  get areaMultiplier(){
    return Math.sqrt(this.area/(1024*768));
  },
  drawDroplet(x,y,r){
    this.drawDrop(this.dropletsCtx,Object.assign(Object.create(Drop),{
      x:x*this.dropletsPixelDensity,
      y:y*this.dropletsPixelDensity,
      r:r*this.dropletsPixelDensity
    }));
  },

  renderDropsGfx(){
    let dropBuffer=createCanvas(dropSize,dropSize);
    let dropBufferCtx=dropBuffer.getContext('2d');
    this.dropsGfx=Array.apply(null,Array(255))
      .map((cur,i)=>{
        let drop=createCanvas(dropSize,dropSize);
        let dropCtx=drop.getContext('2d');

        dropBufferCtx.clearRect(0,0,dropSize,dropSize);

        // color
        dropBufferCtx.globalCompositeOperation="source-over";
        dropBufferCtx.drawImage(this.dropColor,0,0,dropSize,dropSize);

        // blue overlay, for depth
        dropBufferCtx.globalCompositeOperation="screen";
        dropBufferCtx.fillStyle="rgba(0,0,"+i+",1)";
        dropBufferCtx.fillRect(0,0,dropSize,dropSize);

        // alpha
        dropCtx.globalCompositeOperation="source-over";
        dropCtx.drawImage(this.dropAlpha,0,0,dropSize,dropSize);

        dropCtx.globalCompositeOperation="source-in";
        dropCtx.drawImage(dropBuffer,0,0,dropSize,dropSize);
        return drop;
    });

    // create circle that will be used as a brush to remove droplets
    this.clearDropletsGfx=createCanvas(128,128);
    let clearDropletsCtx=this.clearDropletsGfx.getContext("2d");
    clearDropletsCtx.fillStyle="#000";
    clearDropletsCtx.beginPath();
    clearDropletsCtx.arc(64,64,64,0,Math.PI*2);
    clearDropletsCtx.fill();
  },
  drawDrop(ctx,drop){
    if(this.dropsGfx.length>0){
      let x=drop.x;
      let y=drop.y;
      let r=drop.r;
      let spreadX=drop.spreadX;
      let spreadY=drop.spreadY;

      let scaleX=1;
      let scaleY=1.5;

      let d=Math.max(0,Math.min(1,((r-this.options.minR)/(this.deltaR))*0.9));
      d*=1/(((drop.spreadX+drop.spreadY)*0.5)+1);

      ctx.globalAlpha=1;
      ctx.globalCompositeOperation="source-over";

      d=Math.floor(d*(this.dropsGfx.length-1));
      ctx.drawImage(
        this.dropsGfx[d],
        (x-(r*scaleX*(spreadX+1)))*this.scale,
        (y-(r*scaleY*(spreadY+1)))*this.scale,
        (r*2*scaleX*(spreadX+1))*this.scale,
        (r*2*scaleY*(spreadY+1))*this.scale
      );
    }
  },
  clearDroplets(x,y,r=30){
    let ctx=this.dropletsCtx;
    ctx.globalCompositeOperation="destination-out";
    ctx.drawImage(
      this.clearDropletsGfx,
      (x-r)*this.dropletsPixelDensity*this.scale,
      (y-r)*this.dropletsPixelDensity*this.scale,
      (r*2)*this.dropletsPixelDensity*this.scale,
      (r*2)*this.dropletsPixelDensity*this.scale*1.5
    )
  },
  clearCanvas(){
    this.ctx.clearRect(0,0,this.width,this.height);
  },
  createDrop(options){
    if(this.drops.length >= this.options.maxDrops*this.areaMultiplier) return null;

    return Object.assign(Object.create(Drop),options);
  },
  addDrop(drop){
    if(this.drops.length >= this.options.maxDrops*this.areaMultiplier || drop==null) return false;

    this.drops.push(drop);
    return true;
  },
  updateRain(timeScale){
    let rainDrops=[];
    if(this.options.raining){
      let limit=this.options.rainLimit*timeScale*this.areaMultiplier;
      let count=0;
      while(chance(this.options.rainChance*timeScale*this.areaMultiplier) && count<limit){
        count++;
        let r=random(this.options.minR,this.options.maxR,(n)=>{
          return Math.pow(n,3);
        });
        let rainDrop=this.createDrop({
          x:random(this.width/this.scale),
          y:random((this.height/this.scale)*this.options.spawnArea[0],(this.height/this.scale)*this.options.spawnArea[1]),
          r:r,
          momentum:1+((r-this.options.minR)*0.1)+random(2),
          spreadX:1.5,
          spreadY:1.5,
        });
        if(rainDrop!=null){
          rainDrops.push(rainDrop);
        }
      }
    }
    return rainDrops;
  },
  clearDrops(){
    this.drops.forEach((drop)=>{
      setTimeout(()=>{
        drop.shrink=0.1+(random(0.5));
      },random(1200))
    })
    this.clearTexture();
  },
  clearTexture(){
    this.textureCleaningIterations=50;
  },
  updateDroplets(timeScale){
    if(this.textureCleaningIterations>0){
      this.textureCleaningIterations-=1*timeScale;
      this.dropletsCtx.globalCompositeOperation="destination-out";
      this.dropletsCtx.fillStyle="rgba(0,0,0,"+(0.05*timeScale)+")";
      this.dropletsCtx.fillRect(0,0,
        this.width*this.dropletsPixelDensity,this.height*this.dropletsPixelDensity);
    }
    if(this.options.raining){
      this.dropletsCounter+=this.options.dropletsRate*timeScale*this.areaMultiplier;
      times(this.dropletsCounter,(i)=>{
        this.dropletsCounter--;
        this.drawDroplet(
          random(this.width/this.scale),
          random(this.height/this.scale),
          random(...this.options.dropletsSize,(n)=>{
            return n*n;
          })
        )
      });
    }
    this.ctx.drawImage(this.droplets,0,0,this.width,this.height);
  },
  updateDrops(timeScale){
    let newDrops=[];

    this.updateDroplets(timeScale);
    let rainDrops=this.updateRain(timeScale);
    newDrops=newDrops.concat(rainDrops);

    this.drops.sort((a,b)=>{
      let va=(a.y*(this.width/this.scale))+a.x;
      let vb=(b.y*(this.width/this.scale))+b.x;
      return va>vb?1:va==vb?0:-1;
    });

    this.drops.forEach(function(drop,i){
      if(!drop.killed){
        // update gravity
        // (chance of drops "creeping down")
        if(chance((drop.r-(this.options.minR*this.options.dropFallMultiplier)) * (0.1/this.deltaR) * timeScale)){
          drop.momentum += random((drop.r/this.options.maxR)*4);
        }
        // clean small drops
        if(this.options.autoShrink && drop.r<=this.options.minR && chance(0.05*timeScale)){
          drop.shrink+=0.01;
        }
        //update shrinkage
        drop.r -= drop.shrink*timeScale;
        if(drop.r<=0) drop.killed=true;

        // update trails
        if(this.options.raining){
          drop.lastSpawn+=drop.momentum*timeScale*this.options.trailRate;
          if(drop.lastSpawn>drop.nextSpawn){
            let trailDrop=this.createDrop({
              x:drop.x+(random(-drop.r,drop.r)*0.1),
              y:drop.y-(drop.r*0.01),
              r:drop.r*random(...this.options.trailScaleRange),
              spreadY:drop.momentum*0.1,
              parent:drop,
            });

            if(trailDrop!=null){
              newDrops.push(trailDrop);

              drop.r*=Math.pow(0.97,timeScale);
              drop.lastSpawn=0;
              drop.nextSpawn=random(this.options.minR,this.options.maxR)-(drop.momentum*2*this.options.trailRate)+(this.options.maxR-drop.r);
            }
          }
        }

        //normalize spread
        drop.spreadX*=Math.pow(0.4,timeScale);
        drop.spreadY*=Math.pow(0.7,timeScale);

        //update position
        let moved=drop.momentum>0;
        if(moved && !drop.killed){
          drop.y+=drop.momentum*this.options.globalTimeScale;
          drop.x+=drop.momentumX*this.options.globalTimeScale;
          if(drop.y>(this.height/this.scale)+drop.r){
            drop.killed=true;
          }
        }

        // collision
        let checkCollision=(moved || drop.isNew) && !drop.killed;
        drop.isNew=false;

        if(checkCollision){
          this.drops.slice(i+1,i+70).forEach((drop2)=>{
            //basic check
            if(
              drop != drop2 &&
              drop.r > drop2.r &&
              drop.parent != drop2 &&
              drop2.parent != drop &&
              !drop2.killed
            ){
              let dx=drop2.x-drop.x;
              let dy=drop2.y-drop.y;
              var d=Math.sqrt((dx*dx)+(dy*dy));
              //if it's within acceptable distance
              if(d<(drop.r+drop2.r)*(this.options.collisionRadius+(drop.momentum*this.options.collisionRadiusIncrease*timeScale))){
                let pi=Math.PI;
                let r1=drop.r;
                let r2=drop2.r;
                let a1=pi*(r1*r1);
                let a2=pi*(r2*r2);
                let targetR=Math.sqrt((a1+(a2*0.8))/pi);
                if(targetR>this.options.maxR){
                  targetR=this.options.maxR;
                }
                drop.r=targetR;
                drop.momentumX+=dx*0.1;
                drop.spreadX=0;
                drop.spreadY=0;
                drop2.killed=true;
                drop.momentum=Math.max(drop2.momentum,Math.min(40,drop.momentum+(targetR*this.options.collisionBoostMultiplier)+this.options.collisionBoost));
              }
            }
          });
        }

        //slowdown momentum
        drop.momentum-=Math.max(1,(this.options.minR*0.5)-drop.momentum)*0.1*timeScale;
        if(drop.momentum<0) drop.momentum=0;
        drop.momentumX*=Math.pow(0.7,timeScale);


        if(!drop.killed){
          newDrops.push(drop);
          if(moved && this.options.dropletsRate>0) this.clearDroplets(drop.x,drop.y,drop.r*this.options.dropletsCleaningRadiusMultiplier);
          this.drawDrop(this.ctx, drop);
        }

      }
    },this);

    this.drops = newDrops;
  },
  update(){
    this.clearCanvas();

    let now=Date.now();
    if(this.lastRender==null) this.lastRender=now;
    let deltaT=now-this.lastRender;
    let timeScale=deltaT/((1/60)*1000);
    if(timeScale>1.1) timeScale=1.1;
    timeScale*=this.options.globalTimeScale;
    this.lastRender=now;

    this.updateDrops(timeScale);

    requestAnimationFrame(this.update.bind(this));
  }
}



const fragment="precision mediump float;\n\n// textures\nuniform sampler2D u_waterMap;\nuniform sampler2D u_textureShine;\nuniform sampler2D u_textureFg;\nuniform sampler2D u_textureBg;\n\n// the texCoords passed in from the vertex shader.\nvarying vec2 v_texCoord;\nuniform vec2 u_resolution;\nuniform vec2 u_parallax;\nuniform float u_parallaxFg;\nuniform float u_parallaxBg;\nuniform float u_textureRatio;\nuniform bool u_renderShine;\nuniform bool u_renderShadow;\nuniform float u_minRefraction;\nuniform float u_refractionDelta;\nuniform float u_brightness;\nuniform float u_alphaMultiply;\nuniform float u_alphaSubtract;\n\n// alpha-blends two colors\nvec4 blend(vec4 bg,vec4 fg){\n  vec3 bgm=bg.rgb*bg.a;\n  vec3 fgm=fg.rgb*fg.a;\n  float ia=1.0-fg.a;\n  float a=(fg.a + bg.a * ia);\n  vec3 rgb;\n  if(a!=0.0){\n    rgb=(fgm + bgm * ia) / a;\n  }else{\n    rgb=vec3(0.0,0.0,0.0);\n  }\n  return vec4(rgb,a);\n}\n\nvec2 pixel(){\n  return vec2(1.0,1.0)/u_resolution;\n}\n\nvec2 parallax(float v){\n  return u_parallax*pixel()*v;\n}\n\nvec2 texCoord(){\n  return vec2(gl_FragCoord.x, u_resolution.y-gl_FragCoord.y)/u_resolution;\n}\n\n// scales the bg up and proportionally to fill the container\nvec2 scaledTexCoord(){\n  float ratio=u_resolution.x/u_resolution.y;\n  vec2 scale=vec2(1.0,1.0);\n  vec2 offset=vec2(0.0,0.0);\n  float ratioDelta=ratio-u_textureRatio;\n  if(ratioDelta>=0.0){\n    scale.y=(1.0+ratioDelta);\n    offset.y=ratioDelta/2.0;\n  }else{\n    scale.x=(1.0-ratioDelta);\n    offset.x=-ratioDelta/2.0;\n  }\n  return (texCoord()+offset)/scale;\n}\n\n// get color from fg\nvec4 fgColor(float x, float y){\n  float p2=u_parallaxFg*2.0;\n  vec2 scale=vec2(\n    (u_resolution.x+p2)/u_resolution.x,\n    (u_resolution.y+p2)/u_resolution.y\n  );\n\n  vec2 scaledTexCoord=texCoord()/scale;\n  vec2 offset=vec2(\n    (1.0-(1.0/scale.x))/2.0,\n    (1.0-(1.0/scale.y))/2.0\n  );\n\n  return texture2D(u_waterMap,\n    (scaledTexCoord+offset)+(pixel()*vec2(x,y))+parallax(u_parallaxFg)\n  );\n}\n\nvoid main() {\n  vec4 bg=texture2D(u_textureBg,scaledTexCoord()+parallax(u_parallaxBg));\n\n  vec4 cur = fgColor(0.0,0.0);\n\n  float d=cur.b; // \"thickness\"\n  float x=cur.g;\n  float y=cur.r;\n\n  float a=clamp(cur.a*u_alphaMultiply-u_alphaSubtract, 0.0,1.0);\n\n  vec2 refraction = (vec2(x,y)-0.5)*2.0;\n  vec2 refractionParallax=parallax(u_parallaxBg-u_parallaxFg);\n  vec2 refractionPos = scaledTexCoord()\n    + (pixel()*refraction*(u_minRefraction+(d*u_refractionDelta)))\n    + refractionParallax;\n\n  vec4 tex=texture2D(u_textureFg,refractionPos);\n\n  if(u_renderShine){\n    float maxShine=490.0;\n    float minShine=maxShine*0.18;\n    vec2 shinePos=vec2(0.5,0.5) + ((1.0/512.0)*refraction)* -(minShine+((maxShine-minShine)*d));\n    vec4 shine=texture2D(u_textureShine,shinePos);\n    tex=blend(tex,shine);\n  }\n\n  vec4 fg=vec4(tex.rgb*u_brightness,a);\n\n  if(u_renderShadow){\n    float borderAlpha = fgColor(0.,0.-(d*6.0)).a;\n    borderAlpha=borderAlpha*u_alphaMultiply-(u_alphaSubtract+0.5);\n    borderAlpha=clamp(borderAlpha,0.,1.);\n    borderAlpha*=0.2;\n    vec4 border=vec4(0.,0.,0.,borderAlpha);\n    fg=blend(border,fg);\n  }\n\n  // CROWNY adaptation: transparent outside drops so live HTML stays interactive.\n  float edge=clamp(length(refraction),0.0,1.0);\n  fg.rgb=mix(fg.rgb,vec3(0.22,0.34,0.29),edge*0.15);\n  fg.rgb+=vec3(pow(max(0.0,dot(normalize(vec3(refraction,0.6)),normalize(vec3(-0.6,-0.8,1.0)))),24.0)*0.28);\n  gl_FragColor = fg;\n}\n";
const maps={"alpha": "data:image/png;base64,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", "color": "data:image/png;base64,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"};
class CrownyRain {
 constructor(scene){
  this.scene=scene;this.ready=false;this.generation=0;this.snapshotId=0;
  this.canvas=document.createElement('canvas');this.canvas.dataset.rainOverlay='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:28,opacity:0,transition:'opacity 1.6s'});scene.append(this.canvas);
  try {this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});if(!this.gl)throw Error('WebGL unavailable');this.setup();}
  catch(e){this.canvas.remove();this.error=e;return;}
  Promise.all(Object.values(maps).map(url=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url}))).then(([alpha,color])=>{this.alpha=alpha;this.color=color;this.ready=true;}).catch(e=>{this.error=e;});
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.ready=false;this.canvas.style.opacity=0;});
  this.canvas.addEventListener('webglcontextrestored',()=>{try{this.setup();this.ready=true;this.resize(this.w,this.h);}catch{this.ready=false;}});
 }
 setup(){const gl=this.gl;const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,'attribute vec2 a_position; varying vec2 v_texCoord; void main(){v_texCoord=(a_position+1.0)*0.5;gl_Position=vec4(a_position,0.,1.);}'));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(this.program,'a_position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  this.textures=[0,1,2,3].map(unit=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([248,247,242,255]));return t;});
  [['waterMap',0],['textureShine',1],['textureFg',2],['textureBg',3],['renderShine',0],['renderShadow',1]].forEach(([n,v])=>this.uniform(n,'1i',v));
  [['minRefraction',34],['refractionDelta',75],['brightness',1],['alphaMultiply',20],['alphaSubtract',5],['parallaxBg',0],['parallaxFg',0]].forEach(([n,v])=>this.uniform(n,'1f',v));this.uniform('parallax','2f',0,0);
 }
 uniform(name,type,...values){this.gl['uniform'+type](this.gl.getUniformLocation(this.program,'u_'+name),...values);}
 texture(unit,image){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,this.textures[unit]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);}
 resize(w,h){if(!this.ready)return;this.w=w;this.h=h;this.canvas.width=Math.round(w);this.canvas.height=Math.round(h);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);this.uniform('resolution','2f',this.canvas.width,this.canvas.height);this.uniform('textureRatio','1f',w/h);
  this.engine=new Raindrops(w,h,1,this.alpha,this.color,{minR:3,maxR:28,dropletsRate:0});
  for(let i=0;i<120;i++)this.engine.drawDroplet(Math.random()*w,Math.random()*h,.6+Math.random()*1.3);
  const bg=createCanvas(w,h),c=bg.getContext('2d');c.fillStyle='#f8f7f2';c.fillRect(0,0,w,h);const water=this.scene.querySelector('#loginWater');if(water)try{c.drawImage(water,0,0,w,h)}catch{}
  this.texture(2,bg);this.texture(3,bg);this.capture();
 }
 capture(){if(!window.html2canvas)return;const token=++this.snapshotId;
  // Inputs and character are excluded before capture, never persisted or sent anywhere.
  html2canvas(this.scene,{scale:1,backgroundColor:'#f8f7f2',logging:false,ignoreElements:e=>e.matches?.('input,textarea,.login-character,#loginFog,#clearFog,[data-rain-overlay],.weather-preview')||((e.tagName==='CANVAS')&&e.id!=='loginWater'),onclone:doc=>{const s=doc.querySelector('[data-screen="login"]');s?.classList.remove('fog-character-active');doc.querySelectorAll('input,textarea').forEach(e=>{e.value='';e.removeAttribute('value')});}}).then(image=>{if(token!==this.snapshotId||!this.ready)return;this.texture(2,image);this.texture(3,image);}).catch(()=>{});
 }
 render(drops,now){if(!this.ready||!this.engine)return false;const e=this.engine;e.clearCanvas();e.ctx.drawImage(e.droplets,0,0);for(const b of drops){if(b.absorbed)continue;const age=Math.min(1,Math.max(0,(now-b.born)/1600));if(age<=0)continue;const shapes=[[1,1],[.83,1.2],[1.22,.83],[.94,1.08]],p=shapes[b.shape||0],stretch=b.falling?1+Math.min(.7,.2+b.vy/150):1;const r=(b.visualR||b.r)*age;
  e.ctx.save();e.ctx.translate(b.x,b.y);e.ctx.rotate(b.falling?-Math.atan2(b.vx,Math.max(15,b.vy))*.25:b.shapeTilt||0);e.drawDrop(e.ctx,{x:0,y:0,r,spreadX:p[0]/Math.sqrt(stretch)-1,spreadY:p[1]*stretch/1.5-1});e.ctx.restore();if(b.falling)e.clearDroplets(b.x,b.y,b.r*.8);
 }this.texture(0,e.canvas);this.gl.drawArrays(this.gl.TRIANGLES,0,6);this.canvas.style.opacity=1;return true;}
 wipe(x,y,r){this.engine?.clearDroplets(x,y,r);}
 clear(){this.snapshotId++;this.canvas.style.opacity=0;this.gl?.clear(this.gl.COLOR_BUFFER_BIT);}
}
window.CrownyRain=CrownyRain;
})();
