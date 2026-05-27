const app=document.getElementById('app');

const isTV = window.innerWidth > 900;

if(isTV){
startTVMode();
}else{
startPhoneMode();
}

function generateRoomId(){
return crypto.randomUUID().slice(0,8);
}

function startTVMode(){

const roomId=generateRoomId();

localStorage.setItem('currentTV',roomId);

app.innerHTML=`

<div class="tv-screen">

<div class="qr-box">
<h1 class="tv-title">Smart TV Remote</h1>

<div id="qrcode"></div>

<div class="room-id">
TV ID: ${roomId}
</div>
</div>

<div class="cursor" id="cursor"></div>

</div>

`;

const cursor=document.getElementById('cursor');

let x=300;
let y=300;

const peer=new Peer(roomId);

peer.on('connection',(conn)=>{

conn.on('data',(data)=>{

x+=data.dx*1.4;
y+=data.dy*1.4;

x=Math.max(0,Math.min(window.innerWidth-24,x));
y=Math.max(0,Math.min(window.innerHeight-24,y));

cursor.style.left=x+'px';
cursor.style.top=y+'px';

});

});

createQR(roomId);
}

function startPhoneMode(){

const savedTVs=JSON.parse(localStorage.getItem('pairedTVs')||'[]');

let savedHTML='';

savedTVs.forEach(tv=>{
savedHTML+=`
<div class="saved-tv" onclick="connectToTV('${tv.id}')">
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

const conn=peer.connect(roomId);

const existing=JSON.parse(localStorage.getItem('pairedTVs')||'[]');

const exists=existing.find(tv=>tv.id===roomId);

if(!exists){

existing.push({
id:roomId,
name:'Samsung TV '+roomId
});

localStorage.setItem('pairedTVs',JSON.stringify(existing));
}

let lastX=0;
let lastY=0;
let touching=false;

const pad=document.getElementById('touchpad');

pad.addEventListener('touchstart',(e)=>{

const touch=e.touches[0];

lastX=touch.clientX;
lastY=touch.clientY;

touching=true;

});

pad.addEventListener('touchend',()=>{

touching=false;

});

pad.addEventListener('touchmove',(e)=>{

if(!touching)return;

const touch=e.touches[0];

const dx=touch.clientX-lastX;
const dy=touch.clientY-lastY;

lastX=touch.clientX;
lastY=touch.clientY;

conn.send({
dx,
dy
});

});
}

function createQR(text){

const qr=document.getElementById('qrcode');

qr.innerHTML=`
<img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${text}">
`;

}
