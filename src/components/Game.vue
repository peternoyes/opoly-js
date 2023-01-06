<template>
  <div id="container">
    <div v-if="gameState == 'main'">      
      <button @click="localGame">Local Game</button>
      <button @click="onlineGame">Online Game</button>      
    </div>
    <div v-if="gameState == 'online'">
      <p>
        Name: <input type="text" v-model="online.name" size="10">        
      </p>
      <button @click="newOnlineGame">New Game</button>
      <button @click="joinOnlineGame">Join Game</button>
    </div>
    <div v-if="gameState == 'joinEnterId'">
      ID: <input type="text" v-model="online.gameId" size="10">
      <button @click="joinOnlineGameComplete">Join</button>    
    </div>
    <div v-if="gameState == 'waiting'">
      <p>
        <b>{{ online.gameId }}</b>
      </p>
      <p v-for="player in online.players" v-bind:key="player">
        {{ player }}
      </p>
      <div v-if="online.myGame">
        <p>
          <select v-model="theme">
            <option v-for="theme in themes" v-bind:key="theme">{{ theme }}</option>
          </select>          
        </p>
        <p>
          <button @click="startOnlineGame">Start Game</button>
        </p>
      </div>
      <p v-if="!online.myGame">
        Waiting for host to start the game...
      </p>
    </div>
    <Board v-if="gameState == 'game'" class="canvas" :game="game"/>
    <div v-if="gameState == 'game'" id="overlay">
      <p>Center: ${{ game.board.center }}</p>
      <p>{{ game.message }}</p>
      <p v-if="askToBuy">
        <button @click="yesPurchase">Yes</button>
        <button  @click="noPurchase">No</button>
      </p>
      <p v-if="trade.inTrade">
        <select v-model="trade.mySelected">
          <option v-for="trade in trade.mine" v-bind:key="trade">{{ trade }}</option>
        </select>
        <span> for </span>
        <select v-model="trade.optionSelected">
          <option v-for="trade in trade.options" v-bind:key="trade">{{ trade }}</option>
        </select>
        <button @click="yesTrade">Trade</button>
      </p>
      <p v-if="teamwork.inTeamwork">
        <select v-model="teamwork.optionSelected">
          <option v-for="option in teamwork.options" v-bind:key="option">{{ option }}</option>
        </select>
        <button @click="yesTeamwork">Select</button>
      </p>
      <p v-if="game.turn">Turn: {{ game.turn }}</p>
      <p v-if="!game.gameRunning">
        <select v-model="theme">
          <option v-for="theme in themes" v-bind:key="theme">{{ theme }}</option>
        </select>        
      </p>
      <p>
        <select v-model="speed">
          <option v-for="speed in speeds" v-bind:key="speed">{{ speed }}</option>
        </select>        
      </p>      
      <table class="center">
        <thead>
          <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Money</th>
              <th>{{ game.jailOutCardTitle }}</th>
              <th>Lost Turn</th>
              <th>Games Won</th>
              <th v-if="!game.gameRunning && canAddPlayer"><button @click="addPlayer()">+</button></th>
          </tr>
        </thead>
        <tbody>        
          <tr v-for="player in game.players" v-bind:key="player.key" :style='getTableRowStyle(player)'>
            <td v-if="!game.gameRunning"><input type="text" v-model="player.name" size="10"></td>
            <td v-if="game.gameRunning">{{ player.name }}</td>
            <td v-if="!game.gameRunning">
              <select v-model="player.type">
                <option v-for="type in playerTypes" v-bind:key="type">{{ type }}</option>
              </select>
            </td>
            <td v-if="game.gameRunning">{{ player.type }}</td>          
            <td>${{ player.money }}</td>          
            <td>{{ player.jailOutCards }}</td>
            <td>{{ player.loseturn }}</td>
            <td>{{ player.gamesWon }}</td>
            <td v-if="!game.gameRunning && canRemovePlayer"><button @click="removePlayer(player)">X</button></td>
          </tr>        
        </tbody>
      </table>      
      <p>      
        <button v-if="!game.gameRunning" @click="startGame()">Start Game</button>
      </p>
    </div>
  </div>
</template>

<script>
import Board from './Board.vue'

export default {
  data() {
    return {      
      game: {
        board: {
          squares: [],
          center: 0
        },
        drawCards: [],
        jailOutCardTitle: "",
        jailOutCardText: "",
        jailOutCard: null,
        players: [],
        bank: 5000,
        turn: "",
        message: "",        
        gameRunning: false,
      },
      askToBuy: false,
      trade: {
        inTrade: false,
        mine: [],
        options: [],
        mySelected: "",
        optionSelected: ""
      },
      teamwork: {
        inTeamwork: false,
        options: [],
        optionSelected: "",
        money: 0
      },
      callbacks: {
        counter: 0
      },
      gameState: "main", 
      online: {
        gameId: "",
        name: "My Name",
        myGame: false,
        players: [],
      },      
      normalTimeout: 1500,
      cardTimeout: 3000,
      speed: "slow",
      speeds: [
        "slow",
        "fast",
        "superspeed"
      ],
      playerTypes: [
        "human",
        "ai",
        "badai",
        "horribleai"
       ],
      themes: [
        "space",
        "nationalparks",
        "western",
      ],
      theme: "nationalparks"
    }
  },
  computed: {
    canAddPlayer() {
      return this.game.players.length < 4
    },
    canRemovePlayer() {
      return this.game.players.length > 2
    }
  },
  watch: {
    theme(/*newTheme, oldTheme*/) {
      this.resetGame()
    },
    speed(newSpeed) {
      switch (newSpeed) {
        case "slow":
          this.normalTimeout = 2000
          this.cardTimeout = 5000
          break
        case "fast":
          this.normalTimeout = 1000
          this.cardTimeout = 2500
          break
        case "superspeed":
          this.normalTimeout = 1
          this.cardTimeout = 1
          break
      }
    }
  },
  name: 'Game',
  components: {
    Board
  },
  methods: {
    localGame() {      
      this.gameState = "game"
    },
    onlineGame() {
      this.gameState = "online"
    },
    newOnlineGame() {
      this.sendMessage({
        player: this.online.name,
        type: "new"
      }, (data) => {        
        if (data.success) {
          this.online.gameId = data.gameId
          this.online.players = [this.online.name]
          this.online.myGame = true
          this.gameState = 'waiting'
        } else {
          alert(data.message)
        }
      })
    },
    joinOnlineGame() {
      this.gameState = "joinEnterId"
    },
    joinOnlineGameComplete() {
      this.online.myGame = false
      this.sendMessage({
        player: this.online.name,
        gameId: this.online.gameId,
        type: "join"
      }, () => {
        // TODO: Check response
        this.gameState = 'waiting'
      })
    },
    startOnlineGame() {
      this.game.players = []
      var colors = ["red", "yellow", "blue", "green"]
      for (var i = 0; i < this.online.players.length; i++) {
        var p = this.online.players[i]        
        this.game.players.push({ type: "network", name: p, money: 35, color: colors[i], position: 0, jailOutCards: 0, loseturn: false, gamesWon: 0 })
      }

      this.resetGame()

      this.sendMessage({
        player: this.online.name,
        gameId: this.online.gameId,
        state: this.game,
        type: "start",
      }, () => {        
        // TODO: Check response
        this.gameState = "game"        
        this.startGame()
      })
    },
    resetGame() {
      const space = require("../assets/space.json")
      const nationalParks = require("../assets/nationalparks.json")
      const western = require("../assets/western.json")
      var json = {}
      switch (this.theme) {
        case "space": 
          json = space
          break
        case "nationalparks":
          json = nationalParks
          break
        case "western": 
          json = western
          break
      }
      
      var i
      this.game.bank = 5000
      this.game.message = ""
      this.game.turn = ""
      this.game.board.center = 2
      this.game.jailOutCardTitle = json.jailOutCardTitle
      this.game.jailOutCardText = json.jailOutCard
      this.game.board.squares = json.squares
      for (i = 0; i < this.game.board.squares.length; i++) {
        this.game.board.squares[i].owner = ""
      }

      if (this.game.players.length == 0) {
        this.game.players = [        
          { type: "human", name: "Player 1", money: 35, color: "red", position: 0, jailOutCards: 0, loseturn: false, gamesWon: 0 },
          { type: "ai", name: "Player 2", money: 35, color: "yellow", position: 0, jailOutCards: 0, loseturn: false, gamesWon: 0 },
          { type: "ai", name: "Player 3", money: 35, color: "blue", position: 0, jailOutCards: 0, loseturn: false, gamesWon: 0 },
          { type: "ai", name: "Player 4", money: 35, color: "green", position: 0, jailOutCards: 0, loseturn: false, gamesWon: 0 },
        ]
      } else {
        for (i = 0; i < this.game.players.length; i++) {
          this.game.players[i].money = 35
          this.game.players[i].position = 0
          this.game.players[i].jailOutCards = 0
          this.game.players[i].loseturn = false
        }
      }      
      this.game.drawCards = json.drawCards 
      
      this.game.jailOutCard = this.game.drawCards[0]
      this.shuffleDeck()

      for (i = 0; i < this.game.players.length; i++) {
        this.game.board.squares[this.randomAvailableProperty()].owner = this.game.players[i].name
        this.game.board.squares[this.randomAvailableProperty()].owner = this.game.players[i].name
        this.game.board.squares[this.randomAvailableProperty()].owner = this.game.players[i].name        
      }
    },
    addPlayer() {
      var colors = ["red", "yellow", "blue", "green"]
      var playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"]
      for (var i = 0; i < this.game.players.length; i++) {
        var p = this.game.players[i]
        var index = colors.indexOf(p.color)
        colors.splice(index, 1)
        index = playerNames.indexOf(p.name)
        if (index >= 0) {
          playerNames.splice(index, 1)
        }
      }

      var player = {
        type: "ai",
        name: playerNames[0],
        money: 35,
        color: colors[0],
        position: 0,
        jailOutCards: 0,
        loseturn: false,
        gamesWon: 0
      }

      this.game.players.push(player)
      this.resetGame()
    },
    removePlayer(player) {       
       var i = this.game.players.indexOf(player)       
       this.game.players.splice(i, 1)
       this.resetGame()
    },
    validateMoney(where) {
      var total = this.game.bank
      for (var i = 0; i < this.game.players.length; i++) {
        total += this.game.players[i].money
      }
      total += this.game.board.center

      if (total != (5000 + (35 * this.game.players.length) + 2)) {
        console.log('Should be '+ (5000 + (35 * this.game.players.length) + 2))
        console.log(total)
        console.log(this.game.bank)
        console.log(this.game.players[0].money)
        console.log(this.game.players[1].money)
        console.log(this.game.players[2].money)
        console.log(this.game.players[3].money)
        console.log(this.game.board.center)
        alert(where)
      }
    },
    randomAvailableProperty() {
      var prop = -1
      while (prop < 0) {
        var i = Math.floor(Math.random() * this.game.board.squares.length)
        var s = this.game.board.squares[i]
        if (s.type == "property" && !s.owner) {
          prop = i
          break
        }
      }      
      return prop
    },
    shuffleDeck() {
      var currentIndex = this.game.drawCards.length
      var randomIndex

      while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex--
        [this.game.drawCards[currentIndex], this.game.drawCards[randomIndex]] = [this.game.drawCards[randomIndex], this.game.drawCards[currentIndex]]
      }
    },
    findSquare(name) {
      for (var i = 0; i < this.game.board.squares.length; i++) {
        var s = this.game.board.squares[i]
        if (s.name == name) {
          return s
        }
      }
      return null
    },
    findSquareByType(type) {
      for (var i = 0; i < this.game.board.squares.length; i++) {
        var s = this.game.board.squares[i]
        if (s.type == type) {
          return s
        }
      }
      return null
    },    
    findPlayer(name) {
      for (var i = 0; i < this.game.players.length; i++) {
        if (this.game.players[i].name == name) {
          return this.game.players[i]
        }
      }
      return null
    },
    findPlayerIndex(name) {
      for (var i = 0; i < this.game.players.length; i++) {
        if (this.game.players[i].name == name) {
          return i
        }
      }
      return -1
    },   
    startGame() {
      this.game.gameRunning = true

      if (this.online.gameId) {
        if (this.online.myGame) {
          this.game.turn = this.game.players[0].name
          this.game.message = this.game.message = `${this.game.turn} rolling dice...`
          this.nextState(() => this.rollDice(this.game.players[0]), false)  // Techincally wasn't my turn until now
        }
      } else {        
        this.game.turn = this.game.players[0].name      
        this.game.message = this.game.message = `${this.game.turn} rolling dice...`            
        this.nextState(() => this.rollDice(this.game.players[0]), false)
      }
    },
    nextState(handler, wasMyTurn, timeout = this.normalTimeout) {
      console.log('Next State: ' + this.game.message)
      // If it is my turn or it was my turn and now not my turn, send this message    
      if (this.online.gameId && (wasMyTurn || this.online.name == this.game.turn)) {
        console.log('Sending Update')
        this.sendMessage({
          player: this.online.name,
          gameId: this.online.gameId,
          state: this.game,
          type: "update",
        })
      }

      setTimeout(handler, timeout)
    },
    yesPurchase() {
      var player = this.findPlayer(this.game.turn)
      var s = this.game.board.squares[player.position]
      s.owner = player.name
      player.money -= s.cost
      this.game.bank += s.cost
      this.askToBuy = false
      this.game.message = `${player.name} buys ${s.name}`
      this.nextState(() => this.passDice(player), false)
    },
    noPurchase() {
      var player = this.findPlayer(this.game.turn)
      this.askToBuy = false
      this.passDice(player)
      this.game.message = `${player.name} declined`
      this.nextState(() => this.passDice(player), false)
    },
    rollDice(player) {
      var i = Math.floor(Math.random() * 6) + 1      
      var newPosition = player.position + i      
      if (newPosition >= this.game.board.squares.length) {        
        player.money += 1
        this.game.bank -= 1
        newPosition = newPosition % this.game.board.squares.length
      }
      player.position = newPosition

      var s = this.game.board.squares[player.position]
      this.game.message = `${player.name} rolled a ${i} landing on ${this.getSquareDescription(s)}`
      this.nextState(() => this.processSquare(player, s), false)
    },
    getSquareDescription(square) {
      switch (square.type) {
        case "property":
          return square.name
        default:
          return square.type
      }
    },
    isMonopoly(square) {      
      if (!square.owner)
        return false

      for (var i = 0; i < this.game.board.squares.length; i++) {
        var s = this.game.board.squares[i]
        if (s.group == square.group && s.owner != square.owner)
          return false
      }
      
      return true
    },
    setupTrade(player) {
      this.trade.mine = []
      this.trade.options = []

      var i, s      
      for (i = 0; i < this.game.board.squares.length; i++) {
        s = this.game.board.squares[i]
        if (s.owner == player.name && !this.isMonopoly(s)) {
          // Mine
          this.trade.mine.push(s.name)
        } else if (s.owner && s.owner != player.name && !this.isMonopoly(s)) {
          // Others
          this.trade.options.push(s.name)
        }
      }
      
      if (this.trade.mine.length > 0 && this.trade.options.length > 0) {
        if (this.isHuman(player)) {
          this.trade.mySelected = this.trade.mine[0]
          this.trade.optionSelected = this.trade.options[0]
          this.trade.inTrade = true        
        } else {
          // AI Trade
          if (player.type == "ai" || player.type == "horribleai") {
            var possibilities = []          
            for (i = 0; i < this.trade.mine.length; i++) {
              var m = this.findSquare(this.trade.mine[i])
              for (var j = 0; j < this.trade.options.length; j++) {
                var score = 0              
                var o = this.findSquare(this.trade.options[j])
                score += (5 - m.cost) // Higher score for lower value of my card
                score += o.cost // Higher score for higher value of their card

                var myMonopoly = true
                var themMonopoly = true
                for (var k = 0; k < this.game.board.squares.length; k++) {
                  s = this.game.board.squares[k]
                  if (s.name != o.name && s.group == o.group && s.owner != player.name) {                  
                    myMonopoly = false
                  }
                  if (s.name != m.name && s.group == m.group && s.owner != o.owner) {                  
                    themMonopoly = false
                  }

                  if (o.group == m.group) {
                    myMonopoly = false
                    themMonopoly = false
                  }
                }

                if (myMonopoly) {
                  score += 5                
                }
                if (themMonopoly) {
                  score -= 5                
                }

                possibilities.push({
                  mine: m,
                  option: o,
                  myMonopoly: myMonopoly,
                  themMonopoly: themMonopoly,
                  score: score
                })
              }
            }

            possibilities.sort((a, b) => a.score > b.score ? 1 : -1)
            var t = {}
            if (player.type == "ai") {
              t = possibilities[possibilities.length - 1] // Take the best option which is at the end of the list
            } else if (player.type == "horribleai") {
              t = possibilities[0]  // Take the worst option which is at the front of the list
            }
            t.mine.owner = t.option.owner
            t.option.owner = player.name
            this.game.message = `${t.mine.name} was traded for ${t.option.name}`
            this.nextState(() => this.passDice(player), false)
          } else if (player.type == "badai") {
            var mine = this.findSquare(this.trade.mine[Math.floor(Math.random() * this.trade.mine.length)])
            var option = this.findSquare(this.trade.options[Math.floor(Math.random() * this.trade.options.length)])
            mine.owner = option.owner
            option.owner = player.name            
            this.game.message = `${mine.name} was traded for ${option.name}`
            this.nextState(() => this.passDice(player), false)
          }
        }
      } else {
        this.game.message = `A trade is not possible`
        this.nextState(() => this.passDice(player), false)
      }
    },
    yesTrade() {
      var player = this.findPlayer(this.game.turn)
      var mine = this.findSquare(this.trade.mySelected)
      var option = this.findSquare(this.trade.optionSelected)
      mine.owner = option.owner
      option.owner = player.name
      this.trade.inTrade = false
      this.game.message = `${mine.name} was traded for ${option.name}`
      this.nextState(() => this.passDice(player), false)
    },
    setupTeamwork(player, money) {
      this.teamwork.options = []
      for (var i = 0; i < this.game.players.length; i++) {
        var p = this.game.players[i]
        if (p.name != player.name) {
          this.teamwork.options.push(p.name)
        }
      }

      this.teamwork.money = money
      if (this.isHuman(player)) {
        this.teamwork.optionSelected = this.teamwork.options[0]
        this.teamwork.inTeamwork = true        
      } else {
        // AI Teamwork (all types of AI do the same thing)
        this.teamwork.options.sort((a, b) => a.money > b.money ? 1 : -1)
        var option = this.findPlayer(this.teamwork.options[0])
        player.money += this.teamwork.money
        option.money += this.teamwork.money
        this.game.bank -= (this.teamwork.money * 2)
        this.game.message = `${player.name} and ${option.name} both received $${this.teamwork.money}`
        this.nextState(() => this.passDice(player), false)
      }
    },
    yesTeamwork() {
      var player = this.findPlayer(this.game.turn)
      var option = this.findPlayer(this.teamwork.optionSelected)

      player.money += this.teamwork.money
      option.money += this.teamwork.money
      this.game.bank -= (this.teamwork.money * 2)

      this.teamwork.inTeamwork = false
      this.game.message = `${player.name} and ${option.name} both received $${this.teamwork.money}`
      this.nextState(() => this.passDice(player), false)
    },
    checkForWinner(player) {
      var winner = null
      if (player.money <= 0) {
        this.game.gameRunning = false
        player.money = 0

        // TODO: Edge case for tie
        for (var i = 0; i < this.game.players.length; i++) {
          var p = this.game.players[i]
          if (p.name != player.name) {
            if (!winner) {
              winner = p
            } else if (p.money > winner.money) {
              winner = p
            }
          }
        }

        if (this.speed != "superspeed") {
          alert(`${winner.name} won with $${winner.money}`)
        }

        winner.gamesWon += 1
        this.resetGame()

        if (this.speed == "superspeed") {
          this.nextState(() => this.startGame(), false)
        }
        return true
      }
      return false
    },
    isHuman(player) {
      if (player.type == "human") {
        return true
      }

      if (player.type == "network") {
        if (player.name == this.online.name) {
          return true
        }
      }

      return false
    },
    processSquare(player, s) {
      switch (s.type) {
        case "property": 
          if (!s.owner) {                    
            if (player.money > s.cost) {
              if (this.isHuman(player)) {
                this.game.message = `Would ${player.name} like to buy ${s.name}`                
                this.askToBuy = true    
              } else {
                // AI always buys for now
                if (player.type == "ai") {
                  s.owner = player.name
                  player.money -= s.cost
                  this.game.bank += s.cost                
                  this.game.message = `${player.name} buys ${s.name}`
                  this.nextState(() => this.passDice(player), false)
                } else if (player.type == "badai" || player.type == "horribleai") {
                  var cutoff = player.type == "badai" ? 0.5 : 0.7
                  if (Math.random() > cutoff) {
                    s.owner = player.name
                    player.money -= s.cost
                    this.game.bank += s.cost                
                    this.game.message = `${player.name} buys ${s.name}`
                    this.nextState(() => this.passDice(player), false)
                  } else {
                    this.game.message = `${player.name} declined`
                    this.nextState(() => this.passDice(player), false)
                  }
                }
              }
            } else {
              this.game.message = `${player.name} does not have enough money to buy ${s.name}`
              this.nextState(() => this.passDice(player), false)
            }
          } else if (s.owner != player.name) {
            var cost = s.cost
            if (this.isMonopoly(s)) {
              cost *= 2
            }            
            this.game.message = `${player.name} owes ${s.owner} $${cost}`
            this.nextState(() => this.payRent(player, s), false)            
          } else {
            this.game.message = `${player.name} already owns ${s.name}`
            this.nextState(() => this.passDice(player), false)
          }
          return // All states have been handled
        case "draw":
          var card = this.game.drawCards[this.game.drawCards.length - 1]
          this.game.drawCards.splice(this.game.drawCards.length - 1, 1)          
          if (card.type != "jailOutCard") {
            this.game.drawCards.splice(0, 0, card)
          }          
          this.game.message = card.text
          var i, p
          switch (card.type) {
            case "paymiddle":                          
              player.money -= card.money
              if (this.checkForWinner(player)) {
                return
              }
              this.game.board.center += card.money
              this.validateMoney('paymiddle')
              break
            case "moveplayer":
              var newPosition = (player.position + card.spaces) % this.game.board.squares.length
              if (newPosition < 0) {
                newPosition += this.game.board.squares.length
              }
              player.position = newPosition
              s = this.game.board.squares[player.position]              
              this.nextState(() => this.processSquare(player, s), false, this.cardTimeout)
              return
            case "trade":
              this.setupTrade(player)
              return
            case "teamwork": 
              this.setupTeamwork(player, card.money)
              return
            case "jailOutCard":
              player.jailOutCards += 1
              break
            case "payeveryone":              
              for (i = 0; i < this.game.players.length; i++) {
                p = this.game.players[i]
                if (p.name != player.name) {
                  if (player.money < card.money) {
                    p.money += player.money
                    player.money = 0
                  } else {
                    p.money += card.money
                    player.money -= card.money
                  }
                  if (this.checkForWinner(player)) {
                    return
                  }
                }
              }
              this.validateMoney('payeveryone')
              break
            case "loseturn":
              player.loseturn = true
              break
            case "everyonepays":             
              for (i = 0; i < this.game.players.length; i++) {
                p = this.game.players[i]
                if (p.name != player.name) {
                  if (p.money < card.money) {
                    player.money += p.money
                    p.money = 0
                  } else {
                    p.money -= card.money
                    player.money += card.money
                  }
                  if (this.checkForWinner(p)) {
                    return
                  }                  
                }
              }
              this.validateMoney('everyonepays')
              break
            case "jump":
              s = this.findSquare(card.square)
              newPosition = this.game.board.squares.indexOf(s)
              if (newPosition < player.position) {
                player.money += 1
                this.game.bank -= 1
              }
              player.position = newPosition              
              this.nextState(() => this.processSquare(player, s), false, this.cardTimeout)
              return
            case "go":
              s = this.game.board.squares[0]
              player.position = 0              
              this.nextState(() => this.processSquare(player, s), false, this.cardTimeout)
              return
            case "jail":
              s = this.findSquareByType("goToJail")
              player.position = this.game.board.squares.indexOf(s)              
              this.nextState(() => this.processSquare(player, s), false, this.cardTimeout)
              return
            case "unowned":
              i = player.position + 1
              while ((i % this.game.board.squares.length) != player.position) {
                var test = this.game.board.squares[i % this.game.board.squares.length]
                if (test.type == "property" && !test.owner) {
                  player.position = i % this.game.board.squares.length
                  s = test                  
                  this.nextState(() => this.processSquare(player, s), false, this.cardTimeout)
                  return
                }
                i++
              }
              break
            case "bankerpayseveryone":
              for (i = 0; i < this.game.players.length; i++) {
                p = this.game.players[i]                
                p.money += card.money
                this.game.bank -= card.money
              }
              this.validateMoney('bankerpayseveryone')
              break
            case "bankerpays":
              player.money += card.money
              this.game.bank -= card.money
              this.validateMoney('bankerpays')
              break
            case "extraturn":              
              this.nextState(() => this.rollDice(player), false, this.cardTimeout)
              return
          }
          
          this.nextState(() => this.passDice(player), false, this.cardTimeout)
          return
        case "goToJail":
          s = this.findSquareByType("jail")
          player.position = this.game.board.squares.indexOf(s)          
          if (player.jailOutCards > 0) {
            player.jailOutCards -= 1
            this.game.drawCards.splice(0, 0, this.game.jailOutCard)
            this.game.message = `${player.name} GOT LOST and used a ${this.game.jailOutCardText}`
          } else {            
            player.money -= 3
            this.game.bank += 3
            this.validateMoney('jail')
            if (this.checkForWinner(player)) {
              return
            }
            this.game.message = `${player.name} GOT LOST and paid $3`
          }

          this.nextState(() => this.passDice(player), false)
          return
        case "trade":
          this.setupTrade(player)
          return
        case "cash":
          player.money += this.game.board.center
          this.game.board.center = 2
          this.game.bank -= 2
          this.validateMoney('cash')
          break
      }

      this.nextState(() => this.passDice(player), false)      
    },
    payRent(player, s) {
      var cost = s.cost
      if (this.isMonopoly(s)) {
        cost *= 2
      }
      player.money -= cost
      this.findPlayer(s.owner).money += cost
      if (player.money < 0) {
        // Edge case of partial payment        
        this.findPlayer(s.owner).money += player.money
      }
      if (this.checkForWinner(player)) {
        return
      }
      
      this.validateMoney('payRent' + cost + ' ' + s.owner)
      this.passDice(player)
    },
    passDice(player) {      
      var nextIndex = (this.findPlayerIndex(player.name) + 1) % this.game.players.length
      if (this.game.players[nextIndex].loseturn) {
        this.game.players[nextIndex].loseturn = false
        nextIndex = (nextIndex + 1) % this.game.players.length
      }
      this.game.turn = this.game.players[nextIndex].name
      this.game.message = `${this.game.turn} rolling dice...`
      if (this.online.gameId) {
        this.nextState(() => {}, true)  // Do not call roleDice, the other network player will pick this up
        // TODO: If other player lost their turn and there are only 2 players, need to roll dice here
      } else {
        this.nextState(() => this.rollDice(this.game.players[nextIndex]), true)
      }
    },
    getTableRowStyle(player) {
      var style = "color:white;background-color:" + player.color + ";"
      if (player.color == "yellow") {
        style = "color:black;background-color:" + player.color + ";"
      }
      if (player.name == this.game.turn) {
        style += "font-weight: bold;"
      } 
      return style
    },
    sendMessage(object, callback) {
      object.id = this.callbacks.counter.toString()
      if (callback) {        
        this.callbacks.counter++
        this.callbacks[object.id] = callback
      }
      this.$socket.send(JSON.stringify(object))
    },
  },
  mounted() {
    this.resetGame()

    this.$options.sockets.onmessage = (event) => {
      var data = JSON.parse(event.data)
      if (data.id) {
        var callback = this.callbacks[data.id]
        if (callback) {
          callback(data)
          delete this.callbacks[data.id]
        }
      } else if (data.type) {
        switch (data.type) {
          case "broadcastPlayerList":
            this.online.players = data.players
            break
          case "broadcastStart":
            this.game = data.state            
            this.gameState = "game"
            this.startGame()
            break
          case "broadcastUpdate":            
            var oldTurn = this.game.turn
            this.game = data.state
            var newTurn = this.game.turn
            if (oldTurn != newTurn && newTurn == this.online.name) {              
              var p
              for (var i = 0; i < this.game.players.length; i++) {
                p = this.game.players[i]
                if (p.name == newTurn) {
                  break
                }
              }
              console.log('Taking over: ' + newTurn)
              this.rollDice(p)
            }            
            break
          // TODO Handle winning message
          // TODO Handle game over if player disconnects
          // TODO Don't let people join in progress games
          // TODO refactor into more components
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
table,
td {
    border: 1px solid #333;
}

.center {
  margin-left: auto;
  margin-right: auto;
}

#overlay {
  position: absolute;
  left: 50%;
  top: 320px;
  width: 500px;
  transform: translate(-50%,0);
}
</style>

