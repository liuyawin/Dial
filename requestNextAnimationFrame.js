
window.requestNextAnimationFrame = (function () {
    var originalWebkitMethod,
        wrapper = undefined,
        callback = undefined,
        geckoVersion = 0,
        userAgent = navigator.userAgent,
        index = 0,
        self = this;

    if (window.webkitRequestAnimationFrame) {
        wrapper = function (time) {
            if (time == undefined) {
                time = +new Date();
            }
            self.callback();
        }

        originalWebkitMethod = window.webkitRequestAnimationFrame;

        window.webkitRequestAnimationFrame = function (callback, element) {
            self.callback = callback;

            originalWebkitMethod(wrapper, element);
        }
    }
    if (window.mozRequestAnimationFrame) {
        index = userAgent.indexOf('rv:');

        if (userAgent.indexOf('Gecko') != -1) {
            geckoVersion = userAgent.substr(index + 3, 3);

            if (geckoVersion === '2.0') {
                window.mozRequestAnimationFrame = undefined;
            }
        }
    }

    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback, element) {
            var start, finish;

            window.setTimeout(function () {
                start = +new Date();
                callback(start);
                finish = +new Date();

                self.timeout = 1000 / 60 - (finish - start);
            }, self.timeout);
        }
})()

//鼠标滚轮
$.fn.dial_mouseWheel = function(fn){
    var $this = $(this);
    if(!$this.length){return $this} 
    var node = $this.get(0);
    var eventType = document.mozFullScreen !== undefined ? 'DOMMouseScroll' : 'mousewheel';
    function wheelFn(e){
        e = e || window.event;
        e.delta = (e.wheelDelta) ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
        if(typeof fn == 'function'){
            fn(e.delta);
        }
        if (e && e.preventDefault){
            e.preventDefault()
        }else{
            e.returnValue = false; 
        }
        return false;
    }
    if(window.addEventListener){
        node.addEventListener(eventType,wheelFn);
    }else if(window.attachEvent){
        node.attachEvent('on' + eventType,wheelFn);
    }  
    return $this;     
};
