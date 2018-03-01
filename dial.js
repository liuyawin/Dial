var Dial = function (node, options) {
    this.node = node;
    this.$canvas = node.find('canvas');
    this.canvas = this.$canvas[0];
    this.options = options;
    this.ctx = canvas.getContext('2d');
    this.r = 0;//圆半径
    this.o = {};//圆心坐标 

    this.activitySpan = [];//两个活动之间间隔的天数
    this.curSpan = 2;//当前剩余的天数跨度，初始值为2，可以为右边留出一格的距离
    this.curActiIndex = 0;//当前绘制的活动的索引

    this.moveLength = 0;//鼠标移动的累加距离
    this.maxAngle = 0;
    this.offsetAngle = 0;//转动时的偏移坐标，初始为0

    this.isLeft = false;//是否已经转到最左边

    //长、短刻度的宽高
    this.longTickWidth = 4;
    this.longTickHeight = 18;
    this.shortTickHeight = 10;

    this.curActiPosition = [];//当前屏幕上显示的活动及位置

    this.longTickDistance = 10;//控制长刻度的距离

    this.init();
}

Dial.prototype = {
    constructor: Dial,
    init: function () {
        if (!this.options.activities) {
            return;
        }
        this.initActivitySpan();//计算每两个活动之间间隔的天数
        this.createDial();
        this.createTipNode();
        this.bindEvent();
    },
    initActivitySpan: function () {
        for (var i = 0; i < this.options.activities.length - 1; i++) {
            var cur = this.options.activities[i];
            var next = this.options.activities[i + 1];
            this.activitySpan.push(this.getDayCount(cur.date, next.date));
        }
    },
    //获取两个日期之间的天数
    getDayCount: function (curDate, nextDate) {
        var curYear = (new Date()).getFullYear();

        var curMonth = curDate.substring(0, curDate.indexOf('月'));
        var curDay = curDate.substring(curDate.indexOf('月') + 1, curDate.length - 1);

        var nextMonth = nextDate.substring(0, nextDate.indexOf('月'));
        var nextDay = nextDate.substring(nextDate.indexOf('月') + 1, nextDate.length - 1);

        var formatCur = Date.parse(curYear + '-' + curMonth + '-' + curDay);
        var formatNext = Date.parse(curYear + '-' + nextMonth + '-' + nextDay);
        var dateSpan = formatNext - formatCur;
        dateSpan = Math.abs(dateSpan);
        var dateCount = Math.floor(dateSpan / (24 * 3600 * 1000));

        return dateCount;
    },
    createDial: function () {
        this.calculateRadius();//计算半径
        this.calculateO();//计算圆心坐标
        this.drawArc();//绘制圆弧
        this.drawScales();//绘制刻度
    },
    initParams: function () {
        this.isLeft = false;
        this.curSpan = 2;
        this.curActiIndex = this.options.activities.length;//当前活动的索引，从最后一个开始
        this.curActiPosition = [];
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

        this.initParams();//重置相关参数

        this.ctx.save();

        for (var angle = this.auxAngle, cnt = 0; angle < ANGLE_MAX - this.offsetAngle + 0.32; angle += ANGlE_DELTA, cnt++) {
            this.drawScale(angle + this.offsetAngle, radius, cnt++);
        }

        this.ctx.restore();
    },
    drawScale: function (angle, radius, cnt) {
        if (this.curActiIndex < 0) {
            return;
        }

        var circleX = this.o.x;
        var circleY = this.o.y;

        var r = 0;//小圆半径

        var isLong = cnt % this.longTickDistance === 0;
        var tickWidth = isLong ? this.longTickHeight : this.shortTickHeight,
            radius = isLong ? radius : radius - this.longTickHeight + this.shortTickHeight;

        //绘制刻度线
        this.ctx.beginPath();
        this.ctx.moveTo(
            circleX + Math.cos(angle) * (radius - tickWidth - r),
            circleY + Math.sin(angle) * (radius - tickWidth - r)
        );

        this.ctx.lineTo(
            circleX + Math.cos(angle) * (radius),
            circleY + Math.sin(angle) * (radius)
        );

        this.ctx.save();
        this.ctx.lineWidth = isLong ? this.longTickWidth : 1;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.stroke();
        this.ctx.restore();

        if (isLong) {
            if (this.curSpan > 1) {
                this.curSpan--;
                return;
            }

            this.curActiIndex--;
            this.curSpan = this.activitySpan[this.curActiIndex - 1];//当前日期和上一个日期间隔的天数

            if (this.curActiIndex < 0) {
                return;
            }

            //绘制小圆圈
            r = 4;
            this.ctx.save();
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.drawDot(
                circleX + Math.cos(angle) * (radius - tickWidth),
                circleY + Math.sin(angle) * (radius - tickWidth),
                r
            );

            this.ctx.font = '12px Microsoft Yahei';
            //绘制文本
            this.drawText(
                circleX + Math.cos(angle) * (radius - tickWidth),
                circleY + Math.sin(angle) * (radius - tickWidth),
            );

            this.ctx.restore();
        }
    },
    drawDot: function (x, y, r) {
        this.ctx.save();

        this.ctx.strokeStyle = 'red';
        this.fillStyle = 'rgba(25, 24, 25, 1)';
        this.ctx.lineWidth = 4;

        this.ctx.beginPath();

        this.ctx.arc(
            x,
            y,
            r,
            0,
            Math.PI * 2,
            true
        );

        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
    },
    drawText: function (x, y) {
        var index = this.curActiIndex;//当前活动索引

        this.ctx.textAlign = 'center';

        if (index >= 0 && this.options.activities && index < this.options.activities.length) {
            //绘制日期
            this.ctx.strokeText(this.options.activities[index].date, x, y - 16);

            //绘制内容
            this.ctx.strokeText(this.options.activities[index].content[0], x, y + 40);

            this.curActiPosition.push({
                index: index,
                x: x,
                y: y
            });
        }

    },
    createTipNode: function () {
        for (var i = 0; i < this.options.activities.length; i++) {
            var activity = this.options.activities[i];
            var div = $('<div class="dial-tip dial-tip' + i + '"><b class="dial-triangle"></b></div>');
            for (var j = 0; j < activity.content.length; j++) {
                var content = activity.content[j];
                var a = $('<a>' + content + '</a>');
                div.append(a);
            }
            this.node.append(div);
        }
    },
    bindEvent: function () {
        this.mouseMoveFunc = this.handleMouseMove.call(this);
        this.mouseClickMoveFunc = this.handleMouseClickMove.call(this);//鼠标拖动处理事件
        this.mouseUpFunc = this.handleMouseUp.call(this);//鼠标抬起处理事件
        this.$canvas.on('mousedown', this.handleMouseDown.call(this));
        this.$canvas.on('mousemove', this.mouseMoveFunc);
    },
    handleMouseDown: function () {
        var _this = this;
        return function (e) {
            _this.preX = e.screenX;
            $('.dial-tip').css('display', 'none');
            _this.$canvas.off('mousemove', _this.mouseMoveFunc);
            $(document).on('mouseup', _this.mouseUpFunc);
            $(document).on('mousemove', _this.mouseClickMoveFunc);
        }
    },
    handleMouseClickMove: function () {
        var _this = this;
        return function (e) {

            if (_this.offsetAngle > 0 && e.screenX - _this.preX < 0) {//最右边再向右拉时拉不动
                return;
            }

            if (_this.isLeft && e.screenX - _this.preX > 0) {//最左边再向左拉时拉不动
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
            _this.$canvas.on('mousemove', _this.mouseMoveFunc);
            $(document).off('mouseup', _this.mouseUpFunc);
            $(document).off('mousemove', _this.mouseClickMoveFunc);
        }
    },
    handleMouseMove: function(){
        var _this = this;
        return function(e){
            var x = e.offsetX,
                y = e.offsetY,
                index = -1;

            $('.dial-tip').css('display', 'none');

            if (_this.curActiPosition.length > 0) {
                for (var i = 0; i < _this.curActiPosition.length; i++) {
                    var pos = _this.curActiPosition[i];
   
                    if (Math.abs(pos.x - x) < 20 && Math.abs(pos.y - y) < 20) {
                        index = _this.options.activities.length - 1 - i;
                        break;
                    }
                }
                if (index >= 0) {
                    var $curTipBox = $('.dial-tip' + index);

                    $curTipBox.css({
                        top: pos.y + 20 + 'px',
                        left: pos.x - 36 + 'px',
                        display: 'block'
                    });
                }
            }
        }
    }
}