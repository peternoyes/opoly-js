<template>
  <div>
    <canvas ref="game" style="border:1px solid #000000;" />              
  </div>
</template>

<script>
export default {
  props: {
    game: Object
  },
  data() {
    return {
      id: undefined,
      context: null,
      size: 1024      
    }
  },
  methods: {    
    loop(/*time*/) {    
      var ctx = this.context
      if (ctx && this.game.board.squares) {
        ctx.clearRect(0, 0, this.size, this.size);
        var cardHeight = this.size / 8
        var cardWidth = (this.size - (2 * cardHeight)) / 7

        var i, isCorner
        for (i = 0; i < 8; i++) {
          isCorner = (i % 8) == 0
          ctx.save()          
          ctx.translate(0, this.size - cardHeight - ((i % 8)* cardWidth))
          ctx.translate(cardHeight / 2, cardHeight / 2)
          ctx.rotate(Math.PI / 2)
          ctx.translate(-cardHeight / 2, -cardHeight / 2)    
          if (isCorner) {   
            this.drawCard(ctx, i, this.game.board.squares[i], cardHeight, cardHeight)
          } else {                   
            this.drawCard(ctx, i, this.game.board.squares[i], cardWidth, cardHeight)
          }                    
          ctx.restore()
        }
        for (i = 8; i < 16; i++) {
          isCorner = (i % 8) == 0          
          ctx.save()          
          ctx.translate((i % 8 - 1) * cardWidth + cardHeight, 0)
          ctx.translate(cardWidth / 2, cardHeight / 2)
          ctx.rotate(Math.PI)
          ctx.translate(-cardWidth / 2, -cardHeight / 2)    
          if (isCorner) {   
            this.drawCard(ctx, i, this.game.board.squares[i], cardHeight, cardHeight)
          } else {                   
            this.drawCard(ctx, i, this.game.board.squares[i], cardWidth, cardHeight)
          }                    
          ctx.restore()
        }
        for (i = 16; i < 24; i++) {
          isCorner = (i % 8) == 0          
          ctx.save()          
          ctx.translate(this.size - cardHeight, (i % 8 - 1) * cardWidth + cardHeight, 0)
          ctx.translate(cardWidth / 2, cardWidth / 2)
          ctx.rotate(Math.PI * (3 /2))
          ctx.translate(-cardWidth / 2, -cardWidth / 2)    
          if (isCorner) {   
            this.drawCard(ctx, i, this.game.board.squares[i], cardHeight, cardHeight)
          } else {                   
            this.drawCard(ctx, i, this.game.board.squares[i], cardWidth, cardHeight)
          }                    
          ctx.restore()
        }
        for (i = 24; i < 32; i++) {
          isCorner = (i % 8) == 0          
          ctx.save()          
          ctx.translate((7 - (i % 8)) * cardWidth + cardHeight, this.size - cardHeight, 0)
          ctx.translate(cardWidth / 2, cardWidth / 2)
          ctx.rotate(Math.PI * 2)
          ctx.translate(-cardWidth / 2, -cardWidth / 2)    
          if (isCorner) {   
            this.drawCard(ctx, i, this.game.board.squares[i], cardHeight, cardHeight)
          } else {                   
            this.drawCard(ctx, i, this.game.board.squares[i], cardWidth, cardHeight)
          }                    
          ctx.restore()
        }
      }

      this.id = requestAnimationFrame(this.loop)
    },

    drawCard(ctx, index, card, width, height) {
      var dotWidth = width / 4
      var dotOffset = 0
      for (var i = 0; i < this.game.players.length; i++) {
        if (this.game.players[i].position == index) {
          ctx.beginPath()
          ctx.ellipse(dotOffset + dotWidth / 2, height - dotWidth / 2, dotWidth / 2 - 2, dotWidth / 2 - 2, 0, 0, Math.PI * 2)
          ctx.fillStyle = this.game.players[i].color
          ctx.fill()
          dotOffset += dotWidth
        }
      }

      ctx.beginPath()
      ctx.lineWidth = "1"
      ctx.strokeStyle = "black"
      ctx.fillStyle = "black"  
      ctx.rect(0, 0, width, height)
      ctx.font = "10px sans-serif";
      if (card.type == "property") {        
        ctx.fillText(card.name, 6, 16)
        ctx.font = "24px sans-serif";
        ctx.fillText("$" + card.cost, 6, 40)
        if (card.owner) {
          ctx.fillText(card.owner, 6, 70)
        }
      } else {        
        ctx.fillText(card.type, 6, 16)
      }
      ctx.stroke()
    }
  },
  mounted() {        
    var c = this.$refs.game
    this.context = c.getContext('2d')    
    c.width = this.size
    c.height = this.size
  },
  created() {
    this.id = requestAnimationFrame(this.loop)
  },
  destroyed() {
    cancelAnimationFrame(this.id)
    this.id = undefined
  }
}
</script>