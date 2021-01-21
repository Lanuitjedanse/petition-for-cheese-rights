(function () {
    // let animation;
    //  animation = requestAnimationFrame(startDraw);
    // headlines.addEventListener("mouseenter", function (e) {
    //     cancelAnimationFrame(animation);
    // });
    let canvas = document.getElementById("canvas");

    let ctx = canvas.getContext("2d");
    let dataURL = canvas.toDataURL();
    console.log("dataUrl:", dataURL);

    // console.log(context);
    console.log("hello");

    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 4;
    let drawing = false;

    let mousePos = {
        x: 0,
        y: 0,
    };
    let lastPos = mousePos;
    // ctx.beginPath(lastPos);

    canvas.addEventListener(
        "mousedown",
        function (e) {
            // drawing = true;
            if (drawing) {
                console.log(e);
                lastPos = getMousePos(canvas, e);
                startDraw();
            }
        },
        false
    );
    canvas.addEventListener(
        "mouseup",
        function (e) {
            console.log(e);
            drawing = false;
            // startDraw();
        },
        false
    );

    canvas.addEventListener(
        "mousemove",
        function (e) {
            // mousePos = getMousePos(canvas, e);
            startDraw();
            console.log(e);
        },
        false
    );

    // function getMousePos(canvasDom, mouseEvent) {
    //     var rect = canvasDom.getBoundingClientRect();
    //     return {
    //         x: mouseEvent.clientX - rect.left,
    //         y: mouseEvent.clientY - rect.top,
    //     };
    // }

    function startDraw() {
        ctx.beginPath();
        ctx.strokeStyle = "hotpink";
        ctx.lineWidth = 4;
        ctx.lineTo(500, 100);
        ctx.moveTo(100, 100);
        ctx.closePath();
    }
})();
