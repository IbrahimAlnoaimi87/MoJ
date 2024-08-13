NamespaceUtility.RegisterNamespace("SourceCode.Forms.Designer");

SourceCode.Forms.Designer.StyleProfileFile = class extends SourceCode.Forms.Designer.DesignerFile
{
    //#region Constructor

    //Param: Guid - Optional - will load the data from db
    //Param: Catid - Optional - will create and resolve a category instance
    constructor(guid, catid)
    {
        super(guid, catid);
        this.DataType = "styleprofile";
        this.#variables = new SourceCode.Forms.Designer.StyleProfileVariableCollection();

        //ensures the StyleProfileManager singleton (static) is initialized
        SourceCode.Forms.Designer.StyleProfileManager.Initialize();

        //the category is not set up or resolving
        if (!!guid && !catid)
        {
            //get the category details for this style profile
            this._getCategoryInfo();
        }


        if (this.Saved)
        {
            this._doWhenCategoryIsResolved(function ()
            {
                this.Load(guid);
            }.bind(this));
            this.Guid = guid;
        }
        
    }

    //#endregion Constructor

    //#region Fields

    #variables; //instance of SourceCode.Forms.Designer.StyleProfileVariableCollection

    //#endregion Fields

    //#region Properties

    get Variables()
    {
        return this.#variables;
    }

    //#endregion Properties

    //#region AJAX methods

    #ajaxSettings = {
        dataType: 'json', //Expecting json response from the server.
        url: 'StyleProfiles/AJAXCall.ashx'
    }

    //Load
    //Loads the style profile item from the DB
    Load(guid)
    {
        this.Guid = guid;
        if (!this.Category.isResolved && !this.Category.isResolving) this._getCategoryInfo();

        this.dispatchEvent(new Event("Loading"));

        var _settings = $.extend({}, this.#ajaxSettings, {
            data: {
                method: 'load',
                guid: this.guid
            },
            type: 'POST',
            error: this._load_error.bind(this),
            success: this._load_success.bind(this),
        });

        //call save method on server side.
        $.ajax(_settings);
    }

    _load_success(data, status, xhr, callback)
    {
        if (checkExists(data.Errors))
        {
            this._load_error(xhr, status, data);
            return;
        }

        this.fromJson(data);
        this.dispatchEvent(new Event("Loaded"));

        //callback is most often used when finishing to close the designer
        if (typeof callback === "function") callback(data, status, xhr);
    }

    _load_error(xhr, data, status)
    {
        console.log("Error Loading Style Profile");
        console.log(xhr);
        console.log(data);

        var event = new Event("LoadError");
        this.dispatchEvent(event);
    }

    Save()
    {
        this._doWhenCategoryIsResolved(function ()
        {
            this.save();
        }.bind(this));
    }

    //Save
    //finish (bool) - whether this is a save on finish. 
    save(callback, finish)
    {
        this.dispatchEvent(new Event("Saving"));

        //clean optional argument
        finish = (finish === true);

        var jsonDefinition = JSON.stringify(this.toJson());

        var _settings = $.extend({}, this.#ajaxSettings, {
            data: {
                method: 'save',
                categoryPath: this.category.path,
                definition: jsonDefinition
            },
            type: 'POST',
            error: this._save_error.bind(this),
            success: function (data, status, xhr) { this._save_success(data, status, xhr, callback); }.bind(this),
        });

        //call save method on server side.
        $.ajax(_settings);
    }

    _save_success(data, status, xhr, callback)
    {
        console.log("saved StyleProfile - data follows");
        console.log(data);

        if (checkExists(data.Errors))
        {
            this._save_error(xhr, status, data);
            return;
        }

        if (!this.Saved)
        {
            SourceCode.Forms.Designer.StyleProfileManager.StyleProfiles.Remove(this);
            this.Guid = data.guid;
            SourceCode.Forms.Designer.StyleProfileManager.StyleProfiles.Add(this);
            this.Saved = true;
        }
        this.dispatchEvent(new Event("Saved"));
        //callback is most often used when finishing to close the designer
        if (typeof callback === "function") callback(data, status, xhr);
    }

    _save_error(xhr, status, data)
    {
        popupManager.showError(data.Message);

        console.log(data);

        this.dispatchEvent(new Event("SaveError"));
        throw "Error Saving Style Profile";
    }

    //gets the category from the styleprofile ID.
    _getCategoryInfo()
    {
        console.log("getCategoryInfo Start");
        var _settings = $.extend({}, this.#ajaxSettings, {
            data: {
                method: 'getcategory',
                guid: this.guid
            },
            type: 'POST',
            error: this._getCategoryInfo_error.bind(this),
            success: this._getCategoryInfo_success.bind(this),
        });

        //call method on server side.
        $.ajax(_settings);
    }


    _getCategoryInfo_success(data, status, xhr)
    {
        console.log("getCategoryInfo Success");
        console.log(data);
        this.Category.resolveFromJson(data); 
    }

    _getCategoryInfo_error(xhr, status, data)
    {
        console.log("Error Retrieving Style Profile Category from StyleProfile Guid");
    }

    _doWhenCategoryIsResolved(fn)
    {
        if (!!this.Category && this.Category.isResolved)
        {
            fn();
        }
        else
        {
            if (!this.Category.isResolving)
            {
                this._getCategoryInfo();
            }
            //TODO: Ideally we would load the category info as part of the file load.
            var delegate = function ()
            {
                this.Category.removeEventListener("Resolved", delegate);
                fn();
            }.bind(this);

            this.Category.attachEventListener("Resolved", delegate);
        }
    }

    //#endregion AJAX methods

    //#region JSON

    //Used for Templates right now
    fromJson(json)
    {
        this.SystemName = json.Name; //system name should not change once an artifect is created
        this.Name = checkExistsNotEmpty(json.DisplayName) ? json.DisplayName: json.Name;

        if (json.Variables && Array.isArray(json.Variables))
        {
            var variables = json.Variables;
            for (var i = 0; i < variables.length; i++)
            {
                var variable = variables[i];
                var styleProfileVariable = new SourceCode.Forms.Designer.StyleProfileVariable(variable.Name, variable.Value, variable.Type);
                this.#variables.Add(styleProfileVariable);
            }
        }
    }

    toJson()
    {
        var json =
        {
            Name: this.Name,
            DisplayName: this.Name,
            Variables: []
        };

        if (checkExists(this.Guid))
        {
            json.ID = this.Guid; 
        }

        if (checkExists(this.SystemName))
        {
            //Once systme name is created for the collateral, it shouldn't be changed.
            json.Name = this.SystemName;
        }

        for (var i = 0; i < this.Variables.Count; i++)
        {
            var item =
            {
                Name: this.Variables.Item(i).Name,
                Value: this.Variables.Item(i).Value,
                Type: this.Variables.Item(i).Type
            };

            json.Variables.push(item);
        }

        return json;
    }

    //#endregion JSON

    //#region Cloning

    fromTemplate(styleProfile)
    {
        styleProfile.Variables.CopyTo(this.Variables);
    }

    //#endregion
};
