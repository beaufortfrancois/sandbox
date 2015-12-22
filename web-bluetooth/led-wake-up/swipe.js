// Modified version of Finger.
// Credits: https://github.com/aino/finger

(function(window) {

  // shortcuts
  var document = window.document,
      abs = Math.abs,
      comp = window.getComputedStyle,
      html = document.documentElement

  // get element width
  var getWidth = function(elem) {

    var w = Math.ceil( ("getBoundingClientRect" in elem) ?
      elem.getBoundingClientRect().width :
      elem.offsetWidth )

    if ( !w && comp ) {
      w = comp(elem, null).width.replace('px','')
    }

    return w
  }

  // short event bindings
  var bind = function(elem, type, handler) {
    elem.addEventListener(type, handler, false)
  }
  var unbind = function(elem, type, handler) {
    elem.removeEventListener(type, handler, false)
  }

  ///

  Swipe = function(elem, options) {

    // default options
    this.config = {
      start: 0,
      duration: 340,
      onchange: function() {},
      oncomplete: function() {},
      easing: function(x,t,b,c,d) {
        return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
      }
    }

    if ( !elem.children.length ) {
      return
    }

    var self = this

    // extend options
    if ( options ) {
      for(var key in options) {
        this.config[key] = options[key]
      }
    }

    this.elem = elem
    this.child = elem.children[0]
    this.to = this.pos = 0
    this.touching = false
    this.start = {}
    this.index = this.config.start
    this.anim = 0

    // Bind event handlers to context
    ;['ontouchstart','ontouchmove','ontouchend','setup'].forEach(function(fn) {
      self[fn] = (function(caller) {
        return function() {
          caller.apply( self, arguments )
        }
      }(self[fn]))
    })

    // the physical animator
    this.setX = function() {

      var style = self.child.style

      return style.MozTransform = style.webkitTransform = 'translate3d(' + self.pos + 'px,0,0)'
    }

    // bind events
    bind(elem, 'touchstart', this.ontouchstart)
    bind(window, 'resize', this.setup)
    bind(window, 'orientationchange', this.setup)

    // set up width
    this.setup()

    // start the animations
    ;(function animloop(){
      window.requestAnimationFrame(animloop)
      self.loop.call( self )
    }())

  }

  Swipe.prototype = {

    constructor: Swipe,

    setup: function() {
      this.width = getWidth( this.elem )
      this.length = Math.ceil( getWidth(this.child) / this.width )
      if ( this.index !== 0 ) {
        this.index = Math.max(0, Math.min( this.index, this.length-1 ) )
        this.pos = this.to = -this.width*this.index
      }
    },

    ontouchstart: function(e) {

      var touch = e.touches

      this.start = {
        pageX: touch[0].pageX,
        pageY: touch[0].pageY,
        time:  +new Date()
      }

      this.isScrolling = null
      this.touching = true
      this.deltaX = 0

      bind(document, 'touchmove', this.ontouchmove)
      bind(document, 'touchend', this.ontouchend)
    },

    ontouchmove: function(e) {

      var touch = e.touches

      // ensure swiping with one touch and not pinching
      if( touch && touch.length > 1 || e.scale && e.scale !== 1 ) return

      this.deltaX = touch[0].pageX - this.start.pageX

      // determine if scrolling test has run - one time test
      if ( this.isScrolling === null ) {
        this.isScrolling = !!(
          this.isScrolling ||
          abs(this.deltaX) < abs(touch[0].pageY - this.start.pageY)
        )
      }

      // if user is not trying to scroll vertically
      if (!this.isScrolling) {

        // prevent native scrolling
        e.preventDefault()

        // increase resistance if first or last slide
        this.deltaX /= ( (!this.index && this.deltaX > 0 || this.index == this.length - 1 && this.deltaX < 0 ) ?
           ( abs(this.deltaX) / this.width + 1.8 )  : 1 )
        this.to = this.deltaX - this.index * this.width
      }
      e.stopPropagation()
    },

    ontouchend: function(e) {

      this.touching = false

      // determine if slide attempt triggers next/prev slide
      var isValidSlide = +new Date() - this.start.time < 250 &&
            abs(this.deltaX) > 40 ||
            abs(this.deltaX) > this.width/2,

          isPastBounds = !this.index && this.deltaX > 0 ||
            this.index == this.length - 1 && this.deltaX < 0

      // if not scrolling vertically
      if ( !this.isScrolling ) {
        this.show( this.index + ( isValidSlide && !isPastBounds ? (this.deltaX < 0 ? 1 : -1) : 0 ) )
      }

      unbind(document, 'touchmove', this.ontouchmove)
      unbind(document, 'touchend', this.ontouchend)
    },

    show: function( index ) {
      if ( index != this.index ) {
        this.config.onchange.call(this, index)
      }
      this.to = -( index*this.width )
      this.index = index
    },

    loop: function() {

      var distance = this.to - this.pos

      // if distance is short or the user is touching, do a 1-1 animation
      if ( this.touching || abs(distance) <= 1 ) {
        this.pos = this.to
        if ( this.anim ) {
          this.config.oncomplete( this.index )
        }
        this.anim = 0
      } else {
          if ( !this.anim ) {
              // save animation parameters
              this.anim = { v: this.pos, c: distance, t: +new Date() }
          }
          // apply easing
          this.pos = this.config.easing(null, +new Date() - this.anim.t, this.anim.v, this.anim.c, this.config.duration)
      }
      this.setX()
    }
  }

}(this))
