var $ = require("jquery");
module.exports = function(selector) {
    var parallax = function(e) {
        var x = -(((100*e.pageX/window.innerWidth))/2);
        var y = -(((100*e.pageY/(window.innerHeight+window.scrollY)))/2);

        if(!this.list)
            this.list = {};

        if(!this.list[selector]) {
            this.list[selector] = {
                "parent": $(selector).parent().parent()
            }
        }

        var positionTop = this.list[selector].parent.position().top + this.list[selector].parent.outerHeight();

        if(document.body.scrollTop <= positionTop) {
            $(selector).css({
                "left": (x / 5) + "%",
                "top": (28 * (y / 100) * 2) + "%"
            });
        }
    }
    $(window).mousemove(function(e){
        if(this.timerId) {
            return false;
        } else {
            this.timerId = setTimeout(function(){
                parallax(e);
                clearTimeout(this.timerId);
                this.timerId = false;
            }.bind(this), 50);
        }
    });
};