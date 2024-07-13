jQuery.fn.textarea = function(options) {
    
    return this.each(function() {
        
        var $this = jQuery(this);
        
        // Get some values
        var $width = $this.width();
        
        $this.wrap("<div class=\"textarea\"><div class=\"textarea-m\"><div></div></div></div>");
        
        $this.parent().before("<div class=\"textarea-t\"><div></div></div>");
        $this.parent().after("<div class=\"textarea-b\"><div></div></div>");
        
        $this.parent().parent().width($width);
        
        $this.on("focus blur", function() {
            jQuery(this).parent().parent().toggleClass("active");
        });
        
    });
    
}

jQuery(document).ready(function() {
    
    jQuery("textarea[class=blackjax]").textarea();
    
});
