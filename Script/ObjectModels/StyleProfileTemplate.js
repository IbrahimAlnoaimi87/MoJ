
//Purpose: A Model for style profile templates

NamespaceUtility.RegisterNamespace("SourceCode.Forms.Designer");

SourceCode.Forms.Designer.StyleProfileTemplate = class extends SourceCode.Forms.Designer.EventTarget
{
    //#region Properties

    get StyleProfile()
    {
        return this.#styleProfile;
    }

    get TemplateImageURL()
    {
        return this.#templateImageFile;
    }

    //#endregion Properties


    //#region Fields

    #styleProfile; //a reference to a SourceCode.Forms.Designer.StyleProfile
    #templateImageFile;

    //#endregion Fields


    //#region Constructor

    constructor()
    {
        super();
    }

    //#endregion Constructor

    //#region JSON

    fromJSON(json)
    {
        if (!this.#styleProfile)
        {
            this.#styleProfile = new SourceCode.Forms.Designer.StyleProfileFile();
        }

        this.#styleProfile.fromJSON(json);

        this.#templateImageFile = json.previewImage;
    }

    //#endregion JSON

}
