const app=document.getElementById('app');

const isTV=window.innerWidth>900;

if(isTV){
startTVMode();
}else{
startPhoneMode();
}

function getTVId(){

let savedId=localStorage.getItem('tvId');

if(savedId)return savedId;

savedId='tv-'+crypto.randomUUID().slice(0,8);

localStorage.setItem('tvId',savedId);

return savedId;

}

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

<h2 id="status"
style="
position:absolute;
top:20px;
right:320px;
font-size:22px;
color:#aaa;
z-index:20;
">
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

<div class="cursor" id="cursor"></div>

</div>

`;

const status=document.getElementById('status');

const cursor=document.getElementById('cursor');

const cards=document.querySelectorAll('.app-card');

let x=300;
let y=300;

const sensitivity=1.4;

const peer=new Peer(roomId);

peer.on('open',()=>{

status.innerText='TV Ready';

console.log('TV Ready');

});

peer.on('error',(err)=>{

status.innerText='Peer Error';

console.log(err);

});

peer.on('connection',(conn)=>{

status.innerText='Phone Connected';

document
.querySelector('.qr-box')
.classList.add('hidden');

console.log('Phone Connected');

conn.on('close',()=>{

status.innerText='Disconnected';

});

conn.on('error',(err)=>{

status.innerText='Connection Error';

console.log(err);

});

conn.on('data',(data)=>{

if(!data)return;

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

if(data.type==='click'){

performClick();

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

alert(card.innerText);

}

});

}

createQR(roomId);

}

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

</div>

`;

const roomId=prompt('Enter TV ID');

if(roomId){

connectToTV(roomId);

}

}

function connectToTV(roomId){

const peer=new Peer();

peer.on('open',()=>{

console.log('Phone Peer Ready');

const conn=peer.connect(roomId);

conn.on('open',()=>{

console.log('Connected To TV');

saveTV(roomId);

setupTouchpad(conn);

});

conn.on('close',()=>{

alert('Disconnected');

});

conn.on('error',(err)=>{

alert('Connection Failed');

console.log(err);

});

});

}

function setupTouchpad(conn){

const pad=document.getElementById('touchpad');

let lastX=0;
let lastY=0;
let touching=false;

pad.addEventListener('touchstart',(e)=>{

touching=true;

const touch=e.touches[0];

lastX=touch.clientX;
lastY=touch.clientY;

});

pad.addEventListener('touchend',()=>{

touching=false;

});

pad.addEventListener('touchmove',(e)=>{

if(!touching)return;

e.preventDefault();

const touch=e.touches[0];

const dx=touch.clientX-lastX;
const dy=touch.clientY-lastY;

lastX=touch.clientX;
lastY=touch.clientY;

conn.send({

type:'move',
dx,
dy,
time:Date.now()

});

});

pad.addEventListener('click',()=>{

conn.send({

type:'click'

});

});

}

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

function createQR(text){

const qr=document.getElementById('qrcode');

qr.innerHTML=`

<img
src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${text}"
>

`;

}