NamespaceUtility.RegisterNamespace("SourceCode.Forms.Designer");

SourceCode.Forms.Designer.FormFile = class extends SourceCode.Forms.Designer.DesignerFile
{
    //#region Constructor


    //Param: Guid - Optional - will load the data from db
    //Param: Catid - Optional - will create and resolve a category instance
    constructor(guid, catid)
    {
        super(guid, catid); //should resolve the category
        this.#formControlPropertyChangedDelegate = this._formControlPropertyChanged.bind(this);

        this.DataType = "form";
        this.Guid = guid;

        this.set_FormControl(SourceCode.Forms.Designer.ControlManager.Controls.Item(this.Guid));
    }

    //#endregion Constructor

    //#region Fields

    #formControl; //reference to a SourceCode.Forms.Designer.Control.
    #styleProfile; //reference to a SourceCode.Forms.Designer.StyleProfileFile

    #formControlPropertyChangedDelegate; //internal delegate

    //#endregion Fields

    //#region Properties

    set Guid(value)
    {
        super.Guid = value;

        console.log("FormFile guid set");
        this.set_FormControl(SourceCode.Forms.Designer.ControlManager.Controls.Item(this.Guid));
    }

    get Guid()
    {
        return super.Guid;
    }

    get FormControl()
    {
        if (!this.#formControl)
        {
            this.set_FormControl(SourceCode.Forms.Designer.ControlManager.Controls.Item(this.Guid));
        }
        return this.#formControl;       
    }

    //private set
    set_FormControl(value)
    {
        console.log("setting formControl " + value);
        if (!!this.#formControl)
        {
            //unbind
            this.#formControl.removeEventListener("ControlPropertyChanged", this.#formControlPropertyChangedDelegate);
        }

        this.#formControl = value;

        if (!!this.#formControl)
        {
            //bind
            this.#formControl.attachEventListener("ControlPropertyChanged", this.#formControlPropertyChangedDelegate);
        }
    }


    get StyleProfile()
    {
        return this.#styleProfile;
    }

    set StyleProfile(value)
    {
        this.dispatchEvent(new Event("StyleProfileChanging"));
        this.#styleProfile = value;
        this.dispatchEvent(new Event("StyleProfileChanged"));
        this.raisePropertyChanged("StyleProfile");
    }

    //#endregion Properties


    //#region Private Methods

    _formControlPropertyChanged(ev)
    {
        console.log("FormFile - propertyChanged - setting " + ev.PropertyName);
        switch (ev.PropertyName)
        {
            case "StyleProfile":
                if (ev.InnerPropertyName == "Value")
                {
                    console.log("FormFile - propertyChanged - setting style profile");
                    var prop = this.FormControl.Properties.Item("StyleProfile");
                    var styleProfileID = (!!prop) ? prop.Value : null;

                    if (checkExistsNotEmpty(styleProfileID))
                    {
                        if (!(!!this.StyleProfile && this.StyleProfile.Guid === styleProfileID))
                        {
                            var styleProfile = SourceCode.Forms.Designer.StyleProfileManager.Get(styleProfileID);
                            this.StyleProfile = styleProfile;
                        }
                        else
                        {
                            //its the same StyleProfile, so no need to set it again.
                        }
                    }
                    else
                    {
                        console.log("FormFile.js setting styleprofile to null");
                        this.StyleProfile = null;
                    }
                }
                break;
        }
    }

    //#endregion Private Methods
}
