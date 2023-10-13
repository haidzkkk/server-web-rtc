const { log } = require('console');
var express = require('express');
const createServer = require("http").createServer;
const Server = require("socket.io").Server;

var app = express();
app.get('/', (req, res, next) => {
  res.json("hello")
})

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

const users = []

io.on("connection", async (socket) => {
  console.log("Socket.io client connected")

  socket.on("message", (json) => {
    const data = JSON.parse(json)
    console.log(`message: name ${data.name}, type: ${data.type}, target: ${data.target}`)

    switch (data.type) {
      // đăng nhập thêm user
      case "store_user": {
        const user = findUser(data.name)
        if (user != null) {
          io.emit(`client-${data.name}`, JSON.stringify({
            type: 'user already exists'
          }))
          return
        } else {
          const newUser = {
            name: data.name
          }
          users.push(newUser)
          io.emit(`client-${data.name}`, JSON.stringify({
            type: 'done'
          }))
        }
        break
      }

      // bắt đầu call
      case "start_call": {
        let userToCall = findUser(data.target)

        if (userToCall) {
          io.emit(`client-${data.name}`, JSON.stringify({
            type: "call_response", data: "ok"
          }))
        } else {
          io.emit(`client-${data.name}`, JSON.stringify({
            type: "call_response", data: "user is not online"
          }))
        }
        break
      }

      // gọi
      case "create_offer": {
        let userToReceiveOffer = findUser(data.target)
        if (userToReceiveOffer) {
          io.emit(`client-${data.target}`, JSON.stringify({
            type: 'offer_received',
            name: data.name,
            data: data.data.sdp
          }))
          console.log(`create_offer: client-${data.target}`)
        }
        break
      }

      // trả lời
      case "create_answer": {
        let userToReceiveAnswer = findUser(data.target)

        if (userToReceiveAnswer) {
          io.emit(`client-${data.target}`, JSON.stringify({
            type: "answer_received",
            name: data.name,
            data: data.data.sdp
          }))
        }
        break
      }

      // hình như giử giữ liệu
      case "ice_candidate": {
        let userToReceiveIceCandidate = findUser(data.target)
        if (userToReceiveIceCandidate) {
          io.emit(`client-${data.target}`, JSON.stringify({
            type: "ice_candidate",
            name: data.name,
            data: JSON.stringify({
              sdpMLineIndex: data.data.sdpMLineIndex,
              sdpMid: data.data.sdpMid,
              sdpCandidate: data.data.sdpCandidate,
            })
          }))
        }
        break
      }

    }
  })


  socket.on("close", () => {
    users.forEach(user => {
      // if (user.conn === socket) {
      //   users.splice(users.indexOf(user), 1)
      // }
    })
  })

})

const findUser = (username) => {
  for (let i = 0; i < users.length; i++) {
    log(users[i].name + " == " + username)
    if (users[i].name == username) {
      return users[i]
    }

  }
}

httpServer.listen(3001);


module.exports = app;
