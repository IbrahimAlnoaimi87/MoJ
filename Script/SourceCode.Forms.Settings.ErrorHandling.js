//This does not load settings instead it detects issues where settings have not loaded and thye should have
(function ()
{
    if (typeof SourceCode === "undefined" || SourceCode === null ||
    typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null ||
    typeof SourceCode.Forms.Settings === "undefined" || SourceCode.Forms.Settings === null)
    {
        function getNonCacheUrl(url)
        {
            var rts = /([?&])_=[^&]*/;
            var rquery = (/\?/);
            if (rts.test(url))
            {
                // If there is already a '_' parameter, set its value
                url = url.replace(rts, "$1_=" + (new Date()).getTime())
            }
            else
            {
                // Otherwise add one to the end
                url = url + (rquery.test(url) ? "&" : "?") + "_=" + (new Date()).getTime();
            }
            return url;
        };

        function performReload()
        {
            location = getNonCacheUrl(location.href);
            location.reload(true);
        };

        var fallbackErrorMessage = "There was a problem loading site settings. If the issue persists, contact K2 Support. {0} Click OK to retry.";
        if (typeof Resources === "undefined" || Resources === null) Resources = {};
        if (typeof Resources.ExceptionHandler === "undefined" || Resources.ExceptionHandler === null) Resources.ExceptionHandler = {};
        if (typeof Resources.ExceptionHandler.SiteSettingsError === "undefined" || Resources.ExceptionHandler.SiteSettingsError === null) Resources.ExceptionHandler.SiteSettingsError = fallbackErrorMessage;

        $(function ()
        {
           popupManager.showError(
           {
               message: Resources.ExceptionHandler.SiteSettingsError.format("<BR><BR>"),
               onClose: performReload
           });
        });
       
    }
})();