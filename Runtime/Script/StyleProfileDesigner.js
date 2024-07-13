function applyStyleProfile(variables, cssFiles, jsFiles)
{
    replaceStyleProfileStyle(variables);
    replaceStyleProfileCss(cssFiles);
    replaceStyleProfileJs(jsFiles);
}

function replaceStyleProfileJs(jsFiles)
{
    if (Array.isArray(jsFiles))
    {
        $("body").find(".external-js").remove();

        jsFiles.forEach(jsFile =>
        {
            if (!jsFile.isDisabled)
            {
                $("body").append('<script type="text/javascript" src="' + decodeURIComponent(jsFile.url) + '" class="external-js"></script>');
            }
        });
    }
}

function replaceStyleProfileCss(cssFiles)
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
}

function replaceStyleProfileStyle(variables)
{
    if (variables)
    {
        let styleProfile = $("#style-profile-style");

        if (styleProfile.length > 0)
        {
            styleProfile.replaceWith('<style id="style-profile-style">' + variables + '</style>');
        }
        else
        {
            // This should append it at the end, and the replaceStyleProfileCss and replaceStyleProfileJs will be called after the element has been appended the first time
            $("head").append('<style id="style-profile-style">' + variables + '</style>');
        }
    }
}

function applySubformStyleProfile(subforms, variables, cssFiles, jsFiles)
{
    for (var i = 0; i < subforms.length; i++)
    {
        if (typeof subforms[i].applyStyleProfile === 'function')
        {
            subforms[i].applyStyleProfile(
                variables,
                cssFiles,
                jsFiles
            );
        }
    }
}

function applySubviewStyleProfile(subviews, variables, cssFiles, jsFiles) {
    for (var i = 0; i < subviews.length; i++) {
        if (typeof subviews[i].applyStyleProfile === 'function') {
            subviews[i].applyStyleProfile(
                variables,
                cssFiles,
                jsFiles
            );
        }
    }
}
