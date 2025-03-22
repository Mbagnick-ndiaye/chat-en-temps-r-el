import express from 'express';
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
const __filename= fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3500;

const admin= "Admin"

const app= express();

app.use(express.static(path.join(__dirname, "public")))

const expressServer= app.listen(port, () => {
    console.log(`listening on port ${port}`)
});

const UserState = {
    users:[],
    setUsers:function(newUsersArray){
        this.users= newUsersArray
    }
}

const io = new Server( expressServer, {
    cors:{
        origin: process.env.NODE_ENV === "production"? false: ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

io.on("connection", socket =>{
    console.log(`User ${socket.id} connected`);

    socket.emit('message', buildMsg(admin, "Bienvenue dans votre application de chat"));

    socket.on('enterRoom', ({name, room})=>{
        const prevRoom = getUser(socket.id)?.room;
        if(prevRoom){
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(admin, `${name} a quitté la discussion`))
        }
        const user= Useractivite(socket.id, name, room);
        if(prevRoom){
            io.to(prevRoom).emit('userList', {
                users: getUserInRoom(prevRoom)
            })
        }
        socket.join(user.room)

        socket.emit('message', buildMsg(admin, `vous avez rejoint le canal ${user.room} `))

        socket.broadcast.to(user.room).emit('message', buildMsg(admin, `${user.name} a rejoint la discussion `))

        io.to(user.room).emit('userList', {
            users: getUserInRoom(user.room)
        })

        io.emit('roomList', { rooms: getAllActiveRooms() })
    })

    // déconnexion de l'utilisateur
    socket.on('disconnect', ()=>{
        const user = getUser(socket.id)
        UserQuitteApp(socket.id)
        if(user){
            io.to(user.room).emit('message', buildMsg(admin, `${user.name} a quitté le room`));
            io.to(user.room).emit('userList', {
                users:getUserInRoom(user.room)
            })

            io.emit('roomList', {
                rooms: getAllActiveRooms()
            })
        }
        console.log(`User ${socket.id} disconnected`);

    });

    socket.on("message", ({name, text}) =>{
        const room = getUser(socket.id)?.room
        if(room){
            io.to(room).emit('message', buildMsg(name, text))
        }
    })

    

    socket.on('activite', (name)=>{
        const room = getUser(socket.id)?.room
        if(room){
            socket.broadcast.to(room).emit('activite', name)
        }
    });
});

function buildMsg(name, text) {
    return{
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

function Useractivite(id, name, room){
    const user = {id, name, room}
    UserState.setUsers([
        ...UserState.users.filter(user => user.id !==id),
        user
    ])
    return user;
}

function UserQuitteApp(id){
    UserState.setUsers(
    UserState.users.filter(user => user.id !==id)
    )
}

function getUser(id){
    return UserState.users.find(user => user.id===id)
}

function getUserInRoom(room){
    return UserState.users.filter(user => user.room===room)
}

function getAllActiveRooms(){
    return Array.from( new Set(UserState.users.map(user => user.room )))
}