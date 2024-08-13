class IconManager
{
    //this mapping is owned by the design team.
    static GetIconDetailLevelForSize(size)
    {
        if (size > 24) return IconDetailLevel.High;
        if (size < 16 && size <= 24) return IconDetailLevel.Medium;
        return IconDetailLevel.Low;
    }

    //file icons with status like "checked out"
    static GetFileIconElementWithState(iconId, isCheckedOut, isCheckedOutToMe, size, variant)
    {
        //TODO: Change the iconid based on checked-out status
        return IconManager.GetIconElement(iconId, IconSet.Filetypes, size, variant);
    }

    //generic icon retrieval
    static GetIconElement(iconId, iconSet, size, variant)
    {
        var identifier = iconId;

        //Get detail level suffix
        var detailLevel = IconManager.GetIconDetailLevelForSize(size);
        var svgSymbolLibrarySuffix = "low";
        switch (detailLevel)
        {
            case IconDetailLevel.Low: svgSymbolLibrarySuffix = "low"; break;
            case IconDetailLevel.Medium: svgSymbolLibrarySuffix = "med"; break;
            case IconDetailLevel.High: svgSymbolLibrarySuffix = "high"; break;
        }

        //get the name of the set.
        var iconSetName = "";
        for (var item in IconSet)
        {
            if (IconSet[item] == iconSet)
            {
                iconSetName = item;
                break;
            }
        }

        //get variant
        var variantClass = "";
        switch (variant)
        {
            case IconVariant.Dark: variantClass = 'dark'; break;
        }

        var url = "Styles\/Platinum2\/Images\/Icons\/_svg\/" + iconSetName + "_" + svgSymbolLibrarySuffix + ".svg#" + identifier;
        var element = $("<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" class=\"icon icon-size" + size + " " + variantClass + "\"><use xlink:href=\"" + url + "\"></use></svg>");
        return element;
    }
}


IconDetailLevel = {
    Low: 1,
    Medium: 2,
    High: 3
};

IconVariant = {
    Normal: 1,
    Dark: 2
}

IconInteractionVariant = {
    Normal: 1,
    Filled: 2
}

//Enum
class IconSet
{
    static Badges = 1;
    static Blocks = 2;
    static Buttons = 3;
    static Datatypes = 4;
    static Developer = 5;
    static Filetypes = 6;
    static Functions = 7;
    static Illustrations = 8;
    static Indicators = 9;
    static Integration = 10;
    static Interactive = 11;
    static Logos = 12;
    static Nouns = 13;
    static Operators = 14;
    static Outcomes = 15;
    static People = 16;
    static Security = 17;
    static Servertypes = 18;
    static Steps = 19;
    static Toolbar = 20;
    static Toolbox = 21;
}
