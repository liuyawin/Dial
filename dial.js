var Dial = function (canvas, options) {
    this.canvas = canvas;
    this.options = options;
    this.ctx = canvas.getContext('2d');
    this.r = 0;//圆半径
    this.o = {};//圆心坐标 

    this.moveLength = 0;//鼠标移动的距离
    this.offsetAngle = 0;//转动时的偏移坐标，初始为0

    //长、短刻度的宽高
    this.longTickWidth = 4;
    this.longTickHeight = 18;
    this.shortTickHeight = 10;

    this.longTickDistance = 20;//控制长刻度的距离

    this.init();
}

Dial.prototype = {
    constructor: Dial,
    init: function () {
        this.createDial();
        this.bindEvent();
    },
    createDial: function () {
        this.calculateRadius();//计算半径
        this.calculateO();//计算圆心坐标
        this.drawArc();//绘制圆弧
        this.drawScales();//绘制刻度
    },
    calculateRadius: function () {
        this.lineLength = Math.sqrt(Math.pow(this.options.p2.x, 2) + Math.pow(this.options.p2.y - this.options.p1.y, 2));//传入的两点连线的长度
        this.options.angle = this.options.angle / 180 * Math.PI;
        this.r = this.lineLength / 2 / Math.cos(Math.PI / 2 - this.options.angle / 2);
    },
    calculateO: function () {
        //计算辅助角度
        this.auxAngle = Math.PI / 2 - this.options.angle / 2 - Math.asin(Math.abs(this.options.p1.y - this.options.p2.y) / this.lineLength);//辅助角

        this.o.x = this.options.p2.x - this.r * Math.cos(this.auxAngle);
        this.o.y = -(this.r * Math.sin(this.auxAngle) - this.options.p2.y);
    },
    drawArc: function () {
        this.ctx.save();
        this.ctx.strokeStyle = 'gray';
        this.ctx.lineWidth = 1;
        this.ctx.arc(this.o.x, this.o.y, this.r, Math.PI / 2 + this.auxAngle, Math.PI / 2 + this.auxAngle + this.options.angle, true);
        this.ctx.stroke();
        this.ctx.restore();
    },
    //绘制刻度
    drawScales: function () {
        var radius = this.r + this.longTickHeight,
            ANGLE_MAX = this.options.angle + this.auxAngle,//刻度的最大角度
            ANGlE_DELTA = Math.PI / 320,//刻度的间隔
            tickWidth;

        this.ctx.save();

        for (var angle = this.auxAngle, cnt = 0; angle < Math.PI * 2; angle += ANGlE_DELTA, cnt++) {
            this.drawScale(angle + this.offsetAngle, radius, cnt++);
        }

        this.ctx.restore();
    },
    drawScale: function (angle, radius, cnt) {
        var circleX = this.o.x;
        var circleY = this.o.y;

        var r = 0;//小圆半径

        var isLong = cnt % this.longTickDistance === 0;
        var tickWidth = isLong ? this.longTickHeight : this.shortTickHeight,
            radius = isLong ? radius : radius - this.longTickHeight + this.shortTickHeight;


        if (isLong) {
            //绘制小圆圈
            r = 4;
            this.drawDot(
                circleX + Math.cos(angle) * (radius - tickWidth),
                circleY + Math.sin(angle) * (radius - tickWidth),
                r,
                0,
                Math.PI * 2
            );
            //绘制文本
            this.drawText(
                circleX + Math.cos(angle) * (radius - tickWidth),
                circleY + Math.sin(angle) * (radius - tickWidth),
                cnt
            );
        }

        this.ctx.beginPath();
        this.ctx.moveTo(
            circleX + Math.cos(angle) * (radius - tickWidth - r),
            circleY + Math.sin(angle) * (radius - tickWidth - r)
        );

        this.ctx.lineTo(
            circleX + Math.cos(angle) * (radius),
            circleY + Math.sin(angle) * (radius)
        );

        this.ctx.lineWidth = isLong ? this.longTickWidth : 1;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.stroke();
    },
    drawDot: function (x, y, r, startAngle, endAngle) {
        this.ctx.save();

        this.ctx.strokeStyle = 'red';
        this.fillStyle = 'rgba(25, 24, 25, 1)'
        this.ctx.lineWidth = 4;
        
        this.ctx.beginPath();

        this.ctx.arc(
            x,
            y,
            r,
            startAngle,
            endAngle
        );

        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
    },
    drawText: function (x, y, cnt) {
        var index = this.options.activities.length - cnt / this.longTickDistance;//当前活动索引

        this.ctx.textAlign = 'center';

        if (index >= 0 && this.options.activities && index < this.options.activities.length) {
            //绘制日期
            this.ctx.strokeText(this.options.activities[index].date, x, y - 16);

            //绘制内容
            this.ctx.strokeText(this.options.activities[index].content, x, y + 40);
        }

    },
    bindEvent: function () {
        this.mouseMoveFunc = this.handleMouseMove.call(this);
        this.mouseUpFunc = this.handleMouseUp.call(this);
        this.canvas.addEventListener('mousedown', this.handleMouseDown.call(this));
    },
    handleMouseDown: function () {
        var _this = this;
        return function (e) {
            _this.preX = e.screenX;
            document.addEventListener('mouseup', _this.mouseUpFunc);
            document.addEventListener('mousemove', _this.mouseMoveFunc);
        }
    },
    handleMouseMove: function () {
        var _this = this;
        return function (e) {

            if (_this.offsetAngle > 0 && e.screenX - _this.preX < 0) {//
                return;
            }

            _this.moveLength += e.screenX - _this.preX;//鼠标在x方向移动的累计距离
            _this.preX = e.screenX;

            //这里调整转动的速度
            _this.offsetAngle = -_this.moveLength / 180 * Math.PI / 40;

            //清除区域
            _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            //重绘
            _this.drawArc();//绘制圆弧
            _this.drawScales();//绘制刻度
        }
    },
    handleMouseUp: function () {
        var _this = this;
        return function () {
            document.removeEventListener('mouseup', _this.mouseUpFunc);
            document.removeEventListener('mousemove', _this.mouseMoveFunc);
        }
    }
}