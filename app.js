const app=document.getElementById('app');

const isTV=window.innerWidth>900;

if(isTV){
startTVMode();
}else{
startPhoneMode();
}

/* ========================= */
/* TV ID */
/* ========================= */

function getTVId(){

let savedId=localStorage.getItem('tvId');

if(savedId)return savedId;

savedId='tv-'+crypto.randomUUID().slice(0,8);

localStorage.setItem('tvId',savedId);

return savedId;

}

/* ========================= */
/* TV MODE */
/* ========================= */

function startTVMode(){

const roomId=getTVId();

app.innerHTML=`

<div class="tv-screen">

<h1 class="tv-title">
Smart TV OS
</h1>

<div class="qr-box">

<div id="qrcode"></div>

<div class="room-id">
TV ID: ${roomId}
</div>

</div>

<h2 id="status">
Waiting...
</h2>

<div class="launcher">

<div class="app-card">YouTube</div>

<div class="app-card">Movies</div>

<div class="app-card">Browser</div>

<div class="app-card">Games</div>

<div class="app-card">Settings</div>

<div class="app-card">Music</div>

</div>

<div class="game-screen" id="gameScreen">

<div class="back-button">
BACK
</div>

<div class="game-title">
GAME MODE
</div>

<div class="game-player" id="player"></div>

</div>

<div class="cursor" id="cursor"></div>

</div>

`;

const status=document.getElementById('status');

const cursor=document.getElementById('cursor');

const cards=document.querySelectorAll('.app-card');

const gameScreen=document.getElementById('gameScreen');

const player=document.getElementById('player');

let playerX=45;
let playerY=45;

let x=300;
let y=300;

const sensitivity=1.4;

const peer=new Peer(roomId);

peer.on('open',()=>{

status.innerText='TV Ready';

});

peer.on('connection',(conn)=>{

status.innerText='Phone Connected';

document
.querySelector('.qr-box')
.classList.add('hidden');

conn.on('data',(data)=>{

if(!data)return;

/* CURSOR */

if(data.type==='move'){

x+=data.dx*sensitivity;
y+=data.dy*sensitivity;

x=Math.max(
0,
Math.min(window.innerWidth-24,x)
);

y=Math.max(
0,
Math.min(window.innerHeight-24,y)
);

cursor.style.left=x+'px';
cursor.style.top=y+'px';

updateFocus();

}

/* CLICK */

if(data.type==='click'){

performClick();

}

/* SCROLL */

if(data.type==='scroll'){

window.scrollBy(0,data.dy*2);

}

/* GAME JOYSTICK */

if(data.type==='joystick'){

playerX+=data.dx*0.4;
playerY+=data.dy*0.4;

playerX=Math.max(0,Math.min(90,playerX));
playerY=Math.max(0,Math.min(90,playerY));

player.style.left=playerX+'%';
player.style.top=playerY+'%';

}

/* GAME BUTTONS */

if(data.type==='gameButton'){

status.innerText=
'Pressed '+data.button;

}

});

});

function updateFocus(){

cards.forEach(card=>{

const rect=card.getBoundingClientRect();

const inside=
x>rect.left &&
x<rect.right &&
y>rect.top &&
y<rect.bottom;

card.classList.toggle('active',inside);

});

}

function performClick(){

cards.forEach(card=>{

if(card.classList.contains('active')){

const name=card.innerText;

status.innerText='Opened '+name;

if(name==='Games'){

gameScreen.classList.add('active');

}

}

});

}

createQR(roomId);

}

/* ========================= */
/* PHONE MODE */
/* ========================= */

function startPhoneMode(){

const savedTVs=
JSON.parse(
localStorage.getItem('pairedTVs')||'[]'
);

let savedHTML='';

savedTVs.forEach(tv=>{

savedHTML+=`

<div class="saved-tv"
onclick="connectToTV('${tv.id}')">

${tv.name}

</div>

`;

});

app.innerHTML=`

<div class="controller-screen">

<div class="saved-tv-list">

${savedHTML}

</div>

<div class="touchpad" id="touchpad">

Touchpad

</div>

<div class="game-controls" id="gameControls">

<div class="joystick-zone" id="joystick">

<div class="joystick-stick" id="stick"></div>

</div>

<div class="ab-buttons">

<div class="game-btn">A</div>
<div class="game-btn">B</div>
<div class="game-btn">X</div>
<div class="game-btn">Y</div>

</div>

</div>

<div class="gesture-info">

Tap = Click<br>
Double Tap = Double Click<br>
Hold = Long Press<br>
Two Fingers = Scroll

</div>

</div>

`;

const roomId=prompt('Enter TV ID');

if(roomId){

connectToTV(roomId);

}

}

/* ========================= */
/* CONNECT */
/* ========================= */

function connectToTV(roomId){

const peer=new Peer();

peer.on('open',()=>{

const conn=peer.connect(roomId);

conn.on('open',()=>{

saveTV(roomId);

setupTouchpad(conn);

setupGameControls(conn);

});

});

}

/* ========================= */
/* TOUCHPAD */
/* ========================= */

function setupTouchpad(conn){

const pad=document.getElementById('touchpad');

let lastX=0;
let lastY=0;

let touching=false;

let touchStartTime=0;

let lastTap=0;

pad.addEventListener('touchstart',(e)=>{

touching=true;

touchStartTime=Date.now();

const touch=e.touches[0];

lastX=touch.clientX;
lastY=touch.clientY;

});

pad.addEventListener('touchend',()=>{

const duration=Date.now()-touchStartTime;

touching=false;

if(duration<180){

const now=Date.now();

if(now-lastTap<300){

conn.send({

type:'doubleClick'

});

}else{

conn.send({

type:'click'

});

}

lastTap=now;

}

});

pad.addEventListener('touchmove',(e)=>{

if(!touching)return;

e.preventDefault();

if(e.touches.length===2){

const touch=e.touches[0];

const dy=touch.clientY-lastY;

lastY=touch.clientY;

conn.send({

type:'scroll',
dy

});

return;

}

const touch=e.touches[0];

const dx=touch.clientX-lastX;
const dy=touch.clientY-lastY;

lastX=touch.clientX;
lastY=touch.clientY;

conn.send({

type:'move',
dx,
dy

});

});

}

/* ========================= */
/* GAME CONTROLS */
/* ========================= */

function setupGameControls(conn){

const controls=document.getElementById('gameControls');

const joystick=document.getElementById('joystick');

const stick=document.getElementById('stick');

const buttons=
document.querySelectorAll('.game-btn');

controls.classList.add('active');

let centerX=0;
let centerY=0;

joystick.addEventListener('touchstart',(e)=>{

const rect=joystick.getBoundingClientRect();

centerX=rect.left+rect.width/2;
centerY=rect.top+rect.height/2;

});

joystick.addEventListener('touchmove',(e)=>{

e.preventDefault();

const touch=e.touches[0];

const dx=touch.clientX-centerX;
const dy=touch.clientY-centerY;

stick.style.transform=
`translate(${dx*0.4}px,${dy*0.4}px)`;

conn.send({

type:'joystick',
dx,
dy

});

});

joystick.addEventListener('touchend',()=>{

stick.style.transform='translate(0px,0px)';

});

buttons.forEach(btn=>{

btn.addEventListener('touchstart',()=>{

conn.send({

type:'gameButton',
button:btn.innerText

});

});

});

}

/* ========================= */
/* SAVE TV */
/* ========================= */

function saveTV(roomId){

let existing=
JSON.parse(
localStorage.getItem('pairedTVs')||'[]'
);

const found=existing.find(tv=>tv.id===roomId);

if(found)return;

existing.push({

id:roomId,
name:'Samsung TV'

});

localStorage.setItem(
'pairedTVs',
JSON.stringify(existing)
);

}

/* ========================= */
/* QR */
/* ========================= */

function createQR(text){

const qr=document.getElementById('qrcode');

qr.innerHTML=`

<img
src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${text}"
>

`;

}