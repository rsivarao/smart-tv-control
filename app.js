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
Smart TV
</h1>

<div class="qr-box">

<div id="qrcode"></div>

<div class="room-id">
${roomId}
</div>

</div>

<h2 id="status"
style="
position:absolute;
top:20px;
right:320px;
font-size:22px;
color:#aaa;
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

const peer=new Peer(roomId);

peer.on('open',()=>{

status.innerText='TV Ready';

});

peer.on('connection',(conn)=>{

status.innerText='Phone Connected';

conn.on('data',(data)=>{

if(data.type==='move'){

x+=data.dx*1.4;
y+=data.dy*1.4;

x=Math.max(0,Math.min(window.innerWidth-24,x));
y=Math.max(0,Math.min(window.innerHeight-24,y));

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