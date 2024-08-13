NamespaceUtility.RegisterNamespace("SourceCode.Forms.Designer");

//Purpose:
SourceCode.Forms.Designer.StyleProfileFileCollection = class extends SourceCode.Forms.Designer.ObservableCollection
{
    //#region Properties

    //override ObservableCollection
    //which property of an item in the list should be used as the unique ID.
    get HashKey()
    {
        return "Guid";
    }
   
    //#endregion Properties

    //#region Constructor

    constructor()
    {
        super();
    }

    //#endregion Constructor

    //#region Methods

    //override ObservableCollection to ensure a record is created for ids being asked for
    Item(nameOrIndex)
    {
        var file = super.Item(nameOrIndex);

        //attempt to get from XML - might be a newly added control, since the xml was first loaded.
        if (file == null && typeof (nameOrIndex == "string"))
        {
            file = this._loadFileById(nameOrIndex);
        }

        return file;
    }

    //#endregion Methods

    //#region Private Methods

    _loadFileById(id)
    {
        var newfile = new SourceCode.Forms.Designer.StyleProfileFile(id);
        this.Add(newfile);
        return newfile;
    }

    //#endregion Private Methods

}
