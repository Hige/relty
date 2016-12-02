var $ = require("jquery");
module.exports = function(selector) {
    $('a[href$="#"]').on("click", function(){
        return false;
    });
}
