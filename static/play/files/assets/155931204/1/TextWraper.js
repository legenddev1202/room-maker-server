// https://playcanvas.com/project/747389/overview/test-font
pc.TextElement.prototype._setText = (function () {
    // 全局字体
    var canvasFont = new pc.CanvasFont(pc.app, {
        color: new pc.Color(1, 1, 1), // 白色
        fontSize: 64 // 默认大小
    });
    // 初始化字体(基本字符)
    canvasFont.createTextures("!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~");
    // 存储原函数进行hook
    var originalFunc = pc.TextElement.prototype._setText;
    return function (text) {
        // 设置字体
        if (this.font != canvasFont) {
            // 防止playcanvas重设字体
            pc.app.once("postrender", function () {
                this.font = canvasFont;
            }, this);
        }
        // 更新字体贴图
        canvasFont.updateTextures(text);
        // 运行原始函数
        return originalFunc.call(this, text);
    };
})();