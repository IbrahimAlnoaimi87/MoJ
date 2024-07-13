// Radio Button Replacement
jQuery.fn.radiobutton = function(options) {
    
    return this.each(function() {
        
        var $this = jQuery(this);
        
        $this.wrap("<div class=\"radiobutton\"></div>");
        
        $this.before("<div id=\"blackjax_" + $this.attr("id") + "\" class=\"radiobutton-replacement\"></div>");
        
        $this.on("focus blur", function(e) {
            jQuery(this).parent().toggleClass("active");
            switch(e.type) {
                case "focus":
                    $this.trigger("focus");
                    break;
                case "blur":
                    $this.trigger("blur");
                    break;
            }
        });
        
    });
    
}

jQuery(document).ready(function() {
    
    jQuery("input[type=radio][class=blackjax]").radiobutton();
    
});
