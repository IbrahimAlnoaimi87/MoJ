jQuery.fn.textbox = function(options) {
    
    return this.each(function() {
        
        var $this = jQuery(this);
        
        // Get some values
        var $width = $this.width();
        
        $this.wrap("<div class=\"textbox\"></div>");
        
        $this.before("<div class=\"textbox-l\"></div>");
        $this.after("<div class=\"textbox-r\"></div>");
        
        $this.parent().width($width);
        
        $this.on("focus blur", function() {
            jQuery(this).parent().toggleClass("active");
        });
        
    });
    
}

jQuery(document).ready(function() {
    
    jQuery("input[type=text][class=blackjax]").textbox();
    
});
