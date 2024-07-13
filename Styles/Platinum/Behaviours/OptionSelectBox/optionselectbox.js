jQuery.fn.optionselectbox = function(options) {
    
    return this.each(function() {
        
        var $this = jQuery(this);
        
        $this.find("label").on("click", function(e) {
            
            $label = jQuery(this);
            
            $this.find("label.selected").each(function() {
                
                $prev = jQuery(this);
                $prev.removeClass("selected");
                $prev.find("input[type=radio]").eq(0).prop("checked", false).trigger("change");
                
            });
            
            $label.addClass("selected");
            $label.find("input[type=radio]").eq(0).prop("checked", true).trigger("change").trigger("click");
            
            e.stopPropagation();
            e.preventDefault();
            
        });
    
    });
    
}

jQuery(document).ready(function() {
    
    jQuery(".option-select-box").optionselectbox();
    
});
