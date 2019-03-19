onmessage = function(e) {
    const canvas = e.data.offscreenCanvas;
    const ctx = canvas.getContext('2d');
  
    var x = y = ballRadius = 20;
    var dx = dy = 8;

    (function draw() {
        requestAnimationFrame(draw);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI*2);
        ctx.fillStyle = '#3cba54';
        ctx.fill();
        ctx.closePath();

        if (x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
            dx = -dx;
        }
        if (y + dy > canvas.height-ballRadius || y + dy < ballRadius) {
            dy = -dy;
        }

        x += dx;
        y += dy;
    })();
  };

