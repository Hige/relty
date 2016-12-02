var $ = require("jquery");
var randomAnimate = require("./randomArr");

module.exports = function(selector, animated, children) {
    children = !children;
    animated = animated||["jello"];

    if(typeof animated == "string"){
        animated = [animated];
    };

    $(selector).on("mouseenter", function(){
        $(this).data("mouseenter", true);

        if($(this).data("timeoutId"))
            return false;

        var el = children ? $(this).children() : $(this);
        el.addClass("animated " + randomAnimate(animated));
    }).on("mouseleave", function() {
        $(this).data("mouseenter", false);

        if($(this).data("timeoutId"))
            return false;

        var el = children ? $(this).children() : $(this);

        if(!el.hasClass("animated"))
            return false;

        $(this).data("timeoutId", setTimeout(function() {
            var el = children ? $(this).children() : $(this);

            el.removeClass("animated " + animated.join(" "));

            clearTimeout($(this).data("timeoutId"));
            $(this).data("timeoutId", false);

        }.bind(this), 300));
    });

};