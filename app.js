const app=document.getElementById('app');

const isTV = window.innerWidth > 900;

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

<h2 id="status"
style="
position:absolute;
top:20px;
right:20px;
font-size:22px;
color:#aaa;
font-family:Arial;
z-index:20;
">
Waiting For Connection...
</h2>

<div class="qr-box">

<h1 class="tv-title">
Smart TV Remote
</h1>

<div id="qrcode"></div>

<div class="room-id">
TV ID: ${roomId}
</div>

</div>

<div class="cursor" id="cursor"></div>

</div>

`;

const status=document.getElementById('status');

const cursor=document.getElementById('cursor');

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

});

});

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

Touch And Drag

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

dx,
dy,
time:Date.now()

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
src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${text}"
>

`;

}