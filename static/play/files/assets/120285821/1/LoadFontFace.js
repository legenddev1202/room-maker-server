var LoadFontFace = pc.createScript('loadFontFace');
LoadFontFace.attributes.add('fontName', { type: 'string' });

LoadFontFace.prototype.initialize = function () {
    // get the text asset that contains a base64 encoded ttf font
    // Note, to create the base64 encoded font we ran this commend
    // > base64 -i Roboto-Medium.ttf -o Roboto-Medium.base64.txt
    // On OS X command line
    var asset = this.app.assets.find(`${this.fontName}.txt`, "text");

    // Use the browser FontFace API to load the font from the base64 encoded data
    // var fontFace = new FontFace(`${this.fontName}`, 'url(data:application/font-ttf;charset=utf-8;base64,' + asset.resource + ')', {
    var fontFace = new FontFace(`${this.fontName}`, 'url(https://leoluca.io/font/Microsoft-JhengHei.ttf)', {
        style: 'normal',
        display: 'swap',
        weight: '400'
    });
    document.fonts.add(fontFace);
    fontFace.load();

    var self = this;
    fontFace.loaded.then(function () {
        console.log(fontFace);
        self.app.fire("fontface-loaded");
    });
};