jQuery(document).ready(function ()
{
    //#region
    messagePageLoadCompleted();
    // Populates the Panel Header with this page's title
    if (window.frameElement !== null && window.frameElement !== undefined)
    {
        if (document.title !== "")
        {
            window.parent.jQuery("#RuntimePanelContainer").find(".panel-header-text").html(document.title);
        }
    }
    var fileImage = $(".scroll-wrapper").find("a.fileImage, img.fileImage");
    if (fileImage.length > 0)
    {
        fileImage.on("click", openFileImage);
    }
});

function openFileImage(evt)
{
    //#region
    var objClick = (evt.target) ? evt.target : evt.srcElement;
    var objTag = objClick.tagName;
    var sourcePath = "";
    switch (objTag.toUpperCase())
    {
        case "IMG":
            sourcePath = objClick.src.replace("&_controltype=image", "&_controltype=file");
            break;
        case "A":
            sourcePath = objClick.getAttribute("path");
            break;
    }
    var FileFrame = document.getElementById("HiddenFileFrame");
    FileFrame.style.display = "";
    FileFrame.style.display = "none";
    FileFrame.src = sourcePath;
    //#endregion
}

//this sets all global variables as can be expected from other related logic
function messagePageLoadCompleted()
{
    //this indicates that all processing has completed (relevant when navigated to from a popup - to close)
    _runtimeScriptsLoaded = true;
}

