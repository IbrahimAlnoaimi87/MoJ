//Purpose: Caching and Utilities that apply to all file types (smo, view, styleprofile, form, workflow)

if (!SourceCode) SourceCode = {};
if (!SourceCode.Forms) SourceCode.Forms = {};
if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

var DesignerFileManager = SourceCode.Forms.Designer.DesignerFileManager = class extends SourceCode.Forms.Designer.EventTarget
{

    constructor()
    {
        super();
    }

    //#region Icon Retrieval


    //the reason we don't just return the URL is that we want to give SVG DOM in the future (not just SVG as a image URL)
    static GetIconElementForDesignerFile(designerFileObjectModel, size, iconVariant)
    {
        //currently just uses the exact datatype name as the svg identifier. May need to change this later.
        var name = designerFileObjectModel.datatype;
        return IconManager.GetIconElement(name, IconSet.Filetypes, size, iconVariant);
    }

    //#endregion

    //#region Helpers

    //for legacy category system
    static GetCurrentFormCategory()
    {
        return SourceCode.Forms.Designers.Form.categoryId;
    }

    //#endregion
};
