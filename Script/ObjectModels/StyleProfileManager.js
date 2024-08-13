
if (!SourceCode) SourceCode = {};
if (!SourceCode.Forms) SourceCode.Forms = {};
if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

//Singleton
SourceCode.Forms.Designer._StyleProfileManager = class extends SourceCode.Forms.Designer.EventTarget
{
    //#region Fields

    #availableVariables = [];
    #variablesRetrieved = false;
    #variablesRetrieving = false;

    //a SourceCode.Forms.Designer.StyleProfileCollection reference
    //a cahce list of all styleProfiles loaded so far.
    //This is important as event listeners are registered against style profiles, so we can't have 2 instances of
    //a StyleProfileFile class representing the same StyleProfile (ID).
    #styleProfiles; 

    //#endregion Fields

    //#region Properties

    get AvailableVariablesLoaded()
    {
        return this.#variablesRetrieved;
    }

    get AvailableVariables()
    {
        return this.#availableVariables;
    }

    get StyleProfiles()
    {
        return this.#styleProfiles;
    }

    //#endregion Properties

    //#region Constructor

    constructor()
    {
        super();
        this.#styleProfiles = new SourceCode.Forms.Designer.StyleProfileFileCollection();
    }

    //#endregion Constructor

    //#region Public Methods

    //creates a new StyleProfile and adds it to the cache.

    Get(id)
    {
        return this.#styleProfiles.Item(id);
    }

    Create(id, catid)
    {
        var newfile = new SourceCode.Forms.Designer.StyleProfileFile(id, catid);
        this.#styleProfiles.Add(newfile);
        return newfile;
    }

    Initialize()
    {
        //get data that all styleprofiles will need.
        if (this._isInitialized() === true || this.#variablesRetrieving == true)
        {
            return;
        }
    }

    //#endregion Public Methods
   
    //#region Private Methods

    _isInitialized()
    {
        return this.#variablesRetrieved === true ;
    }


    //#endregion Private Methods

    //#region AJAX Methods

    #ajaxSettings = {
        dataType: 'json',
        url: 'StyleProfiles/AJAXCall.ashx'
    }

    _getAvailableVariables()
    {
        this.#variablesRetrieving = true;
        this.dispatchEvent(new Event("AvailableVariablesLoading"));
        var _settings = $.extend({}, this.#ajaxSettings, {
            data: {
                method: 'getavailablevariables',
            },
            type: 'POST',
            error: this._getvariables_error.bind(this),
            success: this._getvariables_success.bind(this),
        });

        //call save method on server side.
        $.ajax(_settings);
    }


    _getvariables_success(data, status, xhr)
    {
        this.#availableVariables = data;
        this.#variablesRetrieved = true;
        this.#variablesRetrieving = false;
        this.dispatchEvent(new Event("AvailableVariablesLoaded"));
    }

    _getvariables_error(xhr, status, data)
    {
        this.#variablesRetrieving = false;
        this.dispatchEvent(new Event("AvailableVariablesLoadError"));
        console.log("Error Loading variables ");
    }

    //#endregion AJAX Methods
}


//Singleton
SourceCode.Forms.Designer.StyleProfileManager = new SourceCode.Forms.Designer._StyleProfileManager();
