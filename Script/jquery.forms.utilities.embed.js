(function ($)
{

    $.extend({

        //_addScripts
        addScripts: function (urls, callback, ignoreBundling)
        {
            var _scripts;
            // Create a clone.
            if (Array.isArray(urls))
            {
                _scripts = urls.slice(0);
            }
            else
            {
                _scripts = [];
            }

            //Recursive loop here!
            if (!!_scripts.length)
            {
                $.addScript(_scripts.shift(), function ()
                {
                    $.addScripts(_scripts, callback, ignoreBundling);
                }, ignoreBundling);

                return;
            }
            else
            {
                if (typeof callback == "function")
                    callback();
            }
        },

        addScript: function (url, callback, ignoreBundling)
        {
            var version = SourceCode.Forms.Settings.Version;
            var useBundledFiles = SourceCode.Forms.Settings.Bundling.UseBundledFiles;

            // Validate arguments
            if (typeof url !== "string") url = null;
            if (typeof callback !== "function") callback = null;
            if (typeof ignoreBundling !== "boolean") ignoreBundling = false;

            if (!useBundledFiles || ignoreBundling)
            {

                var head = document.getElementsByTagName("head")[0];
                var matching = jQuery(head).find('script[src^="' + url + '"]');
                var matchingRooted = jQuery(head).find('script[src^="' + applicationRoot + url + '"]');
                if (matching.length === 0 && matchingRooted.length === 0)
                {
                    var script = document.createElement("script");
                    if (url.indexOf(applicationRoot) === -1 && url.toUpperCase().indexOf("HTTP") != 0)
                    {
                        url = applicationRoot + url;
                    }
                    if (url.indexOf('?') === -1)
                        script.src = url + '?_v=' + version;
                    else
                        script.src = url + '&_v=' + version;
                    script.type = 'text/javascript';

                    // Handle Script loading
                    {
                        var done = false;

                        // Attach handlers for all browsers
                        script.onload = script.onreadystatechange = function ()
                        {
                            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete"))
                            {
                                done = true;

                                if (callback) callback(this);

                                // Handle memory leak in IE
                                script.onload = script.onreadystatechange = null;
                            }
                        };
                    }

                    head.appendChild(script);
                }
                else
                {
                    if (callback) callback(matching[0]);
                }
            }
            else
            {
                if (callback) callback(this);
            }

            // We handle everything using the script element injection
            return undefined;
        },


        // Adds links external files to the designer. Currently only adding CSS files.
        addExternalFiles: function (files)
        {
            let cssFiles = files.filter(f => f.type.toLocaleUpperCase() === "CSS");

            this.addExternalStylesheets(cssFiles);
        },

        // Add links to external css files to the designer. Removes existing external files first.
        addExternalStylesheets: function (cssFiles)
        {
            if (Array.isArray(cssFiles))
            {
                $("head").find(".external-css").remove();

                cssFiles.forEach(cssFile =>
                {
                    if (!cssFile.isDisabled)
                    {
                        $("head").append('<link rel="stylesheet" href="' + decodeURIComponent(cssFile.url) + '" class="external-css" />');
                    }
                });
            }
        },

        addStylesheet: function (url, options, callback, ignoreBundling)
        {
            var version = SourceCode.Forms.Settings.Version;
            var useBundledFiles = SourceCode.Forms.Settings.Bundling.UseBundledFiles;

            // Validate arguments
            if (typeof url !== "string") url = null;
            if (!$.isPlainObject(options)) options = null;
            if (typeof callback !== "function") callback = null;
            if (typeof ignoreBundling !== "boolean") ignoreBundling = false;

            // TEMPFIX: Force the use of unbundled resources for 1.0.1, Remove once bundling of CSS is implemeneted
            ignoreBundling = true;

            if (!useBundledFiles || ignoreBundling)
            {

                var head = document.getElementsByTagName("head")[0];
                if (checkExists(url) && url.indexOf("$staticBundle$") >= 0)
                {
                    url = url.replace("$staticBundle$", SourceCode.Forms.Settings.Bundling.StaticBundlePathPrefix);
                }
                var matching = jQuery(head).find('link[href^="' + url + '"]');
                var matchingRooted = jQuery(head).find('link[href^="' + applicationRoot + url + '"]');
                if (matching.length === 0 && matchingRooted.length === 0)
                {
                    var link = document.createElement("link");
                    if (url.indexOf(applicationRoot) === -1 && url.toUpperCase().indexOf("HTTP") != 0)
                    {
                        url = applicationRoot + url;
                    }
                    if (url.indexOf('?') === -1)
                        link.setAttribute("href", url + '?_v=' + version);
                    else
                        link.setAttribute("href", url + '&_v=' + version);
                    link.setAttribute("rel", "stylesheet");
                    link.setAttribute("type", "text/css");

                    if (options)
                    {
                        if (options.id) link.setAttribute("id", options.id);
                        if (options.media) link.setAttribute("media", options.media);
                        if (options.title) link.setAttribute("title", options.title);
                    }

                    // Handle Stylesheet loading
                    {
                        var done = false;

                        // Attach handlers for all browsers
                        link.onload = link.onreadystatechange = function ()
                        {
                            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete"))
                            {
                                done = true;
                                if (callback) callback(this);
                                $('body').trigger('SF-theme-changed');
                                // Handle memory leak in IE
                                link.onload = link.onreadystatechange = null;
                            }
                        };
                    }

                    head.appendChild(link);
                }
                else
                {
                    if (callback) callback(matching[0]);
                }
            }
            else
            {
                if (callback) callback(this);
            }
            // We handle everything using the script element injection
            return undefined;
        }

    });

    $.switchstyle = function (style)
    {
        var themeStylesheets = $("link[rel*=style][id='" + style + "']");
        var additionalThemeStylesheets = $("link[rel*=style][id^='" + style + "/']");

        themeStylesheets.prop("disabled", false);
        additionalThemeStylesheets.prop("disabled", false);

        setTimeout(function ()
        {
            $("link[rel*=style][id]").each(
                function (i)
                {
                    if ((this.getAttribute("id") !== style) && (this.getAttribute("id").indexOf(style + "/", 0) !== 0))
                    {
                        $(this).prop("disabled", true);
                    }
                }
            );

            if ((themeStylesheets.length > 0) || (additionalThemeStylesheets.length > 0))
            {
                $('body').trigger('SF-theme-changed');
            }
        }, 250);
    };

    $.nostyle = function ()
    {
        $("link[rel*=style][id]").each(
            function (i)
            {
                $(this).prop("disabled", true);
            }
        );
    };

    $.removestyle = function (styleid) 
    {
        $("link[rel*=style][id^='" + styleid + "']").remove();
    };

    $.removeAllStylesForIdWithExclusion = function (styleId, excludedId) 
    {
        var selectorString = "link[rel*=style][id^='" + styleId + "']";

        if (checkExistsNotEmpty(excludedId))
        {
            selectorString = selectorString + "[id!='" + excludedId + "']";
        }

        $(selectorString).remove();
    };

    $.enablestyle = function (style)
    {
        $('body').trigger('SF-theme-changed');
        $("link[rel*=style][id='" + style + "']").prop("disabled", false);
        $("link[rel*=style][id^='" + style + "/']").prop("disabled", false);
    };

    $.disablestyle = function (style)
    {
        $("link[rel*=style][id='" + style + "']").prop("disabled", true);
        $("link[rel*=style][id^='" + style + "/']").prop("disabled", false);
    };

})(jQuery);
