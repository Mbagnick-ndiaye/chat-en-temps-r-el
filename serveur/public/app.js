const socket= io('ws://localhost:3500');

const msgInput = document.querySelector("#message");
const nameInput = document.querySelector("#name");
const chatRoom = document.querySelector("#room");
const activite = document.querySelector('.activite');
const users = document.querySelector('.utilisateur');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');



function envoieMessage(e){
    e.preventDefault();
    if(nameInput.value && msgInput.value && chatRoom.value){
        socket.emit( 'message', {
            name: nameInput.value,
            text: msgInput.value
    })
        msgInput.value="";
    }
    msgInput.focus();
}

function enterRoom(e){
    e.preventDefault();
    if(nameInput.value && chatRoom.value){
        socket.emit('enterRoom', {
            name:nameInput.value,
            room:chatRoom.value
        })
    }
}

document.querySelector('.form-msg')
.addEventListener('submit', envoieMessage);
document.querySelector('.form-join')
.addEventListener('submit', enterRoom);

msgInput.addEventListener('keypress', ()=>{
    socket.emit('activite', nameInput.value);
});

socket.on("message", (data)=>{
    activite.textContent = "";
    const {name, text, time} = data
    const li= document.createElement('li');
    li.className= 'post';
    if(name === nameInput.value) li.className = 'post post--left'
    if(name!== nameInput.value && name !== 'Admin') li.className = 'post post--right'
    if(name !== 'Admin'){
        li.innerHTML = `<div class= "post__header ${name === nameInput.value? 
            'post__header--user': 'post__header--reply'
        }">
        <span class= "post__header--name">${name}</span>
        <span class= "post__header--time">${time}</span>
        </div>
        <div class = "post__text">${text}</div>`
    }
    else{
        li.innerHTML= `<div class = "post__text">${text}</div>`
    }
    document.querySelector('.chat-display').appendChild(li);
    if(chatDisplay){
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
});


 let activitetime;
socket.on("activite", (name)=>{
    activite.textContent= `${name} en train d'écrire...`;
    clearTimeout(activitetime);
    activitetime = setTimeout(()=>{
        activite.textContent= ""
    }, 3000);
})

socket.on('usersList', ({users })=>{
    voirUtilisateur(users)
})

socket.on('roomList', ({rooms })=>{
    voirChat(rooms)
})


function voirUtilisateur(usersList){
    users.textContent ='';
    if(usersList){
        users.innerHTML = `<em>Utilisateur présent dans le chat ${chatRoom.value}:</em>`
        usersList.forEach((user, i) =>{
            users.textContent += `${user.name}`
            if(usersList.length >1 && i !== usersList.length-1){
                users.textContent = ", "
            }
        })
    }
}

function voirChat(rooms){
    roomList.textContent ='';
    if(rooms){
        roomList.innerHTML = '<em>Activité:</em>'
        rooms.forEach((room, i) =>{
            roomList.textContent += `${room}`
            if(rooms.length >1 && i !== rooms.length-1){
                roomList.textContent = ", "
            }
        })
    }
}