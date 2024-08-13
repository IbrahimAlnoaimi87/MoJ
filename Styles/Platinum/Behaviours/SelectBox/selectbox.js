jQuery.fn.selectbox = function(options) {
    
    return this.each(function() {
        
        var $this = jQuery(this);
        
        // Get some values
        var $width = $this.width();
        
        // Hide the Select Box
        $this.hide();
        
        var $div = jQuery("<div id=\"blackjax_" + $this.attr("id") + "\" class=\"selectbox\"><span class=\"selectbox-l\"></span><span class=\"selectbox-c\"></span><span class=\"selectbox-r\"><span class=\"selectbox-button-icon\"></span></span></div>").insertAfter($this);
        
        $div.width($width);
        
        var html = "<div id=\"blackjax_body_" + $this.attr("id") + "\" class=\"selectbox-body\"><div class=\"selectbox-body-t\">"
            + "<div class=\"selectbox-body-tl\"></div><div class=\"selectbox-body-tc\"></div><div class=\"selectbox-body-tr\">"
            + "</div></div><div class=\"selectbox-body-m\"><div class=\"selectbox-body-ml\"></div><div class=\"selectbox-body-mc\">"
            + "<div class=\"wrapper\"></div></div><div class=\"selectbox-body-mr\"></div></div><div class=\"selectbox-body-b\">"
            + "<div class=\"selectbox-body-bl\"></div><div class=\"selectbox-body-bc\"></div><div class=\"selectbox-body-br\">"
            + "</div></div></div>";
        
        var $body = jQuery(html).insertAfter($div);
        var $height = 6;
        
        for (var i = 0; i < $this[0].options.length; i++) {
            var option = jQuery("<div class=\"selectbox-option\">" + $this[0].options[i].text + "</div>").appendTo($body.find(".wrapper").eq(0));
            $height += 19;
            option.data("option", $this[0].options[i]);
            if ($this[0].options[i].selected) {
                $div.find(".selectbox-c").eq(0).text($this[0].options[i].text);
                option.addClass("selected");
            }
        }
        
        $body.width($width - 2);
        $body.height($height);
        $body.css("left", $div.position().left + 1);
        $body.css("top", $div.position().top + (SourceCode.Forms.Browser.safari == true ? 23:20));
        
        // Event Handling
        // Select Body Toggling
        $div.on("click", function(e) {
            $div.toggleClass("active");
            $body.slideToggle("medium");
            e.stopPropagation();
            $this.trigger("click");
        });
        
        // Select Option Click
        $body.on("click", function(e) {
            
            var option = jQuery(e.target);
            
            $div.find(".selectbox-c").eq(0).text(option.data("option").text);
            
            $body.find(".selected").eq(0).removeClass("selected");
            
            option.addClass("selected");
            
            $this.val(option.data("option").value);
            $this.trigger("change");
            
        });
        
        // Hiding the Select Body
        jQuery(document).on("click", function() { 
            if ($body.is(":visible")) {
                $div.removeClass("active");
                $body.slideUp("medium");
            }
        });
        
    });
    
}

jQuery(document).ready(function() {
    
    jQuery("select[class=blackjax]").selectbox();
    
});
