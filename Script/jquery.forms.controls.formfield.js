(function($) {

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.FormField = {

        html: function(options) {

            var html = "<div class=\"form-field";
            if (options.required !== undefined && options.required) html += " required";
            if (options.stacked !== undefined && options.stacked) html += " stacked";
            if (options.boldlabel !== undefined && options.boldlabel) html += " bold-label";
            html += "\"";
            if (options.id !== undefined && options.id !== "") html += " id=\"" + options.id + "\"";
            html += ">";

            html += "<label class=\"form-field-label\"";
            if (options.forid !== undefined && options.forid !== "") html += " for=\"" + options.forid + "\"";
            html += ">" + options.label + "</label>";

            html += "<div class=\"form-field-element-wrapper\"></div>"

            html += "</div>";

            return html;

        }

    }

    if (typeof SCFormField === "undefined") SCFormField = SourceCode.Forms.Controls.FormField;

})(jQuery);
