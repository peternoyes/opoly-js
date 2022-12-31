<template>
  <div id="container">    
    <Board class="canvas" :game="game"/>
    <div id="overlay">
      <p>Center: ${{ game.board.center }}</p>
      <p>{{ game.message }}</p>
      <p v-if="game.askToBuy">
        <button @click="yesPurchase">Yes</button>
        <button  @click="noPurchase">No</button>
      </p>
      <p v-if="game.trade.inTrade">
        <select v-model="game.trade.mySelected">
          <option v-for="trade in game.trade.mine" v-bind:key="trade">{{ trade }}</option>
        </select>
        <span> for </span>
        <select v-model="game.trade.optionSelected">
          <option v-for="trade in game.trade.options" v-bind:key="trade">{{ trade }}</option>
        </select>
        <button @click="yesTrade">Trade</button>
      </p>
      <p v-if="game.teamwork.inTeamwork">
        <select v-model="game.teamwork.optionSelected">
          <option v-for="option in game.teamwork.options" v-bind:key="option">{{ option }}</option>
        </select>
        <button @click="yesTeamwork">Select</button>
      </p>
      <p v-if="game.turn">Turn: {{ game.turn }}</p>
      <p v-if="!game.gameRunning">
        <select v-model="theme">
          <option v-for="theme in themes" v-bind:key="theme">{{ theme }}</option>
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
          </tr>
        </thead>
        <tbody>        
          <tr v-for="player in game.players" v-bind:key="player.key" :style='getTableRowStyle(player)'>
            <td v-if="!game.gameRunning"><input type="text" v-model="player.name"></td>
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
        turn: "",
        message: "",
        askToBuy: false,        
        gameRunning: false,
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
        }
      },
      bank: 5000,
      normalTimeout: 1500 / 1500,
      cardTimeout: 3000 / 3000,
      playerTypes: [
        "human",
        "ai",
        "badai"
       ],
      themes: [
        "space",
        "nationalparks",
      ],
      theme: "nationalparks"
    }
  },
  watch: {
    theme(/*newTheme, oldTheme*/) {
      this.resetGame()
    }
  },
  name: 'Game',
  components: {
    Board
  },
  methods: {
    resetGame() {
      const space = require("../assets/space.json")
      const nationalParks = require("../assets/nationalparks.json")
      var json = {}
      switch (this.theme) {
        case "space": 
          json = space
          break
        case "nationalparks":
          json = nationalParks
          break
      }
      
      var i
      this.bank = 5000
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
    validateMoney(where) {
      var total = this.bank
      for (var i = 0; i < this.game.players.length; i++) {
        total += this.game.players[i].money
      }
      total += this.game.board.center

      if (total != (5000 + (35 * 4) + 2)) {
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
      this.game.turn = this.game.players[0].name
      this.game.message = this.game.message = `${this.game.turn} rolling dice...`            
      this.nextState(() => this.rollDice(this.game.players[0]))
      this.game.gameRunning = true
    },
    nextState(handler, timeout = this.normalTimeout) {
      setTimeout(handler, timeout)
    },
    yesPurchase() {
      var player = this.findPlayer(this.game.turn)
      var s = this.game.board.squares[player.position]
      s.owner = player.name
      player.money -= s.cost
      this.bank += s.cost
      this.game.askToBuy = false
      this.passDice(player)
    },
    noPurchase() {
      var player = this.findPlayer(this.game.turn)
      this.game.askToBuy = false
      this.passDice(player)
    },
    rollDice(player) {
      var i = Math.floor(Math.random() * 6) + 1      
      var newPosition = player.position + i      
      if (newPosition >= this.game.board.squares.length) {        
        player.money += 1
        this.bank -= 1
        newPosition = newPosition % this.game.board.squares.length
      }
      player.position = newPosition

      var s = this.game.board.squares[player.position]
      this.game.message = `${player.name} rolled a ${i} landing on ${this.getSquareDescription(s)}`
      this.nextState(() => this.processSquare(player, s))
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
      this.game.trade.mine = []
      this.game.trade.options = []

      var i, s      
      for (i = 0; i < this.game.board.squares.length; i++) {
        s = this.game.board.squares[i]
        if (s.owner == player.name && !this.isMonopoly(s)) {
          // Mine
          this.game.trade.mine.push(s.name)
        } else if (s.owner && s.owner != player.name && !this.isMonopoly(s)) {
          // Others
          this.game.trade.options.push(s.name)
        }
      }
      
      if (this.game.trade.mine.length > 0 && this.game.trade.options.length > 0) {
        if (player.type == "human") {
          this.game.trade.mySelected = this.game.trade.mine[0]
          this.game.trade.optionSelected = this.game.trade.options[0]
          this.game.trade.inTrade = true        
        } else {
          // AI Trade
          if (player.type == "ai") {
            var possibilities = []          
            for (i = 0; i < this.game.trade.mine.length; i++) {
              var m = this.findSquare(this.game.trade.mine[i])
              for (var j = 0; j < this.game.trade.options.length; j++) {
                var score = 0              
                var o = this.findSquare(this.game.trade.options[j])
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
            var t = possibilities[possibilities.length - 1]
            t.mine.owner = t.option.owner
            t.option.owner = player.name
            this.game.message = `${t.mine.name} was traded for ${t.option.name}`
            this.nextState(() => this.passDice(player))
          } else if (player.type == "badai") {
            var mine = this.findSquare(this.game.trade.mine[Math.floor(Math.random() * this.game.trade.mine.length)])
            var option = this.findSquare(this.game.trade.options[Math.floor(Math.random() * this.game.trade.options.length)])
            mine.owner = option.owner
            option.owner = player.name            
            this.game.message = `${mine.name} was traded for ${option.name}`
            this.nextState(() => this.passDice(player))
          }
        }
      } else {
        this.game.message = `A trade is not possible`
        this.nextState(() => this.passDice(player))
      }
    },
    yesTrade() {
      var player = this.findPlayer(this.game.turn)
      var mine = this.findSquare(this.game.trade.mySelected)
      var option = this.findSquare(this.game.trade.optionSelected)
      mine.owner = option.owner
      option.owner = player.name
      this.game.trade.inTrade = false
      this.game.message = `${mine.name} was traded for ${option.name}`
      this.nextState(() => this.passDice(player))
    },
    setupTeamwork(player, money) {
      this.game.teamwork.options = []
      for (var i = 0; i < this.game.players.length; i++) {
        var p = this.game.players[i]
        if (p.name != player.name) {
          this.game.teamwork.options.push(p.name)
        }
      }

      if (player.type == "human") {
        this.game.teamwork.optionSelected = this.game.teamwork.options[0]
        this.game.teamwork.inTeamwork = true
        this.game.teamwork.money = money
      } else {
        // AI Teamwork
        this.game.teamwork.options.sort((a, b) => a.money > b.money ? 1 : -1)
        var option = this.findPlayer(this.game.teamwork.options[0])
        player.money += this.game.teamwork.money
        option.money += this.game.teamwork.money
        this.bank -= (this.game.teamwork.money * 2)
        this.game.message = `${player.name} and ${option.name} both received $${this.game.teamwork.money}`
        this.nextState(() => this.passDice(player))
      }
    },
    yesTeamwork() {
      var player = this.findPlayer(this.game.turn)
      var option = this.findPlayer(this.game.teamwork.optionSelected)

      player.money += this.game.teamwork.money
      option.money += this.game.teamwork.money
      this.bank -= (this.game.teamwork.money * 2)

      this.game.teamwork.inTeamwork = false
      this.game.message = `${player.name} and ${option.name} both received $${this.game.teamwork.money}`
      this.nextState(() => this.passDice(player))
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

        // alert(`${winner.name} won with $${winner.money}`)

        winner.gamesWon += 1
        this.resetGame()
        this.nextState(() => this.startGame())
        return true
      }
      return false
    },
    processSquare(player, s) {
      switch (s.type) {
        case "property": 
          if (!s.owner) {                    
            if (player.money > s.cost) {
              if (player.type == "human") {
                this.game.message = `Would ${player.name} like to buy ${s.name}`
                this.game.askToBuy = true    
              } else {
                // AI always buys for now
                if (player.type == "ai") {
                  s.owner = player.name
                  player.money -= s.cost
                  this.bank += s.cost                
                  this.game.message = `${player.name} buys ${s.name}`
                  this.nextState(() => this.passDice(player))
                } else if (player.type == "badai") {
                  if (Math.random() > 0.5) {
                    s.owner = player.name
                    player.money -= s.cost
                    this.bank += s.cost                
                    this.game.message = `${player.name} buys ${s.name}`
                    this.nextState(() => this.passDice(player))
                  } else {
                    this.nextState(() => this.passDice(player))
                  }
                }
              }
            } else {
              this.game.message = `${player.name} does not have enough money to buy ${s.name}`
              this.nextState(() => this.passDice(player))
            }
          } else if (s.owner != player.name) {
            var cost = s.cost
            if (this.isMonopoly(s)) {
              cost *= 2
            }            
            this.game.message = `${player.name} owes ${s.owner} $${cost}`
            this.nextState(() => this.payRent(player, s))            
          } else {
            this.game.message = `${player.name} already owns ${s.name}`
            this.nextState(() => this.passDice(player))
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
              this.nextState(() => this.processSquare(player, s), this.cardTimeout)
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
                this.bank -= 1
              }
              player.position = newPosition
              this.nextState(() => this.processSquare(player, s), this.cardTimeout)
              return
            case "go":
              s = this.game.board.squares[0]
              player.position = 0
              this.nextState(() => this.processSquare(player, s), this.cardTimeout)
              return
            case "jail":
              s = this.findSquareByType("goToJail")
              player.position = this.game.board.squares.indexOf(s)
              this.nextState(() => this.processSquare(player, s), this.cardTimeout)
              return
            case "unowned":
              i = player.position + 1
              while ((i % this.game.board.squares.length) != player.position) {
                var test = this.game.board.squares[i % this.game.board.squares.length]
                if (test.type == "property" && !test.owner) {
                  player.position = i % this.game.board.squares.length
                  s = test
                  this.nextState(() => this.processSquare(player, s), this.cardTimeout)
                  return
                }
                i++
              }
              break
            case "bankerpayseveryone":
              for (i = 0; i < this.game.players.length; i++) {
                p = this.game.players[i]                
                p.money += card.money
                this.bank -= card.money
              }
              this.validateMoney('bankerpayseveryone')
              break
            case "bankerpays":
              player.money += card.money
              this.bank -= card.money
              this.validateMoney('bankerpays')
              break
            case "extraturn":
              this.nextState(() => this.rollDice(player), this.cardTimeout)
              return
          }

          this.nextState(() => this.passDice(player), this.cardTimeout)
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
            this.bank += 3
            this.validateMoney('jail')
            if (this.checkForWinner(player)) {
              return
            }
            this.game.message = `${player.name} GOT LOST and paid $3`
          }

          this.nextState(() => this.passDice(player))
          return
        case "trade":
          this.setupTrade(player)
          return
        case "cash":
          player.money += this.game.board.center
          this.game.board.center = 2
          this.bank -= 2
          this.validateMoney('cash')
          break
      }

      this.nextState(() => this.passDice(player))      
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
      this.nextState(() => this.rollDice(this.game.players[nextIndex]))
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
    }
  },
  mounted() {
    this.resetGame()
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

