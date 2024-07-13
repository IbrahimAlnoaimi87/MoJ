

if (!SourceCode) SourceCode = {};
if (!SourceCode.Forms) SourceCode.Forms = {};
if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

var DesignerFile = SourceCode.Forms.Designer.DesignerFile = class extends SourceCode.Forms.Designer.EventTarget
{
    //#region Properties

    get Guid()
    {
        return this.#guid;
    }

    set Guid(value)
    {
        this.#guid = value;
        this.raisePropertyChanged("Guid");
    }

    get Name()
    {
        return this.#name;
    }

    set Name(value)
    {
        this.#name = value;
        this.raisePropertyChanged("Name");

        this.dispatchEvent(new Event("NameChanged"));
    }

    get DisplayName()
    {
        return this.#displayname;
    }

    set DisplayName(value)
    {
        this.#displayname = value;
        this.raisePropertyChanged("DisplayName");

        this.dispatchEvent(new Event("DisplayNameChanged"));
    }

    get SystemName()
    {
        return this.#systemname;
    }

    set SystemName(value)
    {
        this.#systemname = value;
        this.raisePropertyChanged("SystemName");

        this.dispatchEvent(new Event("SystemNameChanged"));
    }

    get DataType()
    {
        return this.#datatype;
    }

    set DataType(value)
    {
        this.#datatype = value;
        this.raisePropertyChanged("datatype");
    }

    get Saved()
    {
        return this.#saved;
    }

    set Saved(value)
    {
        this.#saved = (value == true);
    }

    //instance of SourceCode.Forms.Designer.Category
    get Category()
    {
        return this.#category;
    }

    //instance of SourceCode.Forms.Designer.Category
    set Category(value)
    {
        this.#category = value;
        this.raisePropertyChanged("Category");
    }

    //#endregion Properties

    //#region Legacy Properties
    //mostly lowercase to support old code paths.
    //the appstudio.designer.namechanging/ed event for the filetbas still use these.

    get datatype()
    {
        return this.DataType;
    }

    set datatype(value)
    {
        this.DataType = value;
    }

    get name()
    {
        return this.Name;
    }

    set name(value)
    {
        this.Name = value;
    }

    get displaynme()
    {
        return this.Name;
    }

    set displayname(value)
    {
        this.DisplayName = value;
    }

    get guid()
    {
        return this.Guid;
    }

    set guid(value)
    {
        this.Guid = value;
    }

    get systemname()
    {
        return this.#systemname;
    }

    set systemname(value)
    {
        this.#systemname = value;
        this.raisePropertyChanged("systemname");
    }

    get catid()
    {
        return this.#category.id;
    }

    get readonly()
    {
        return this.#readonly;
    }

    set readonly(value)
    {
        this.#readonly = value;
        this.raisePropertyChanged("readonly");
    }

    //instance of SourceCode.Forms.Designer.Category
    get category()
    {
        return this.Category;
    }

    //instance of SourceCode.Forms.Designer.Category
    set category(value)
    {
        this.Category = value;
    }

    //#endregion Legacy Properties

    //#region Private properties

    #datatype;
    #name;
    #displayname;
    #guid;
    #systemname;
    #readonly = false;
    #category; //instance of SourceCode.Forms.Designer.Category
    #saved = false; //whether the file is new (pre-save or not)

    //#endregion Private properties

    //#region Constructor

    constructor(guid, catid)
    {
        super();

        this.#guid = guid;

        //we always create a category, to save having to check for its existence everywhere else.
        if (catid != null)
        {
            this.#category = new SourceCode.Forms.Designer.Category(catid);
        }
        else
        {
            this.#category = new SourceCode.Forms.Designer.Category();
        }

        this.#saved = checkExistsNotEmpty(guid);


        // even when not saved the file needs a guid,
        // so that the file can be used in ObservableCollections (has a unique id)
        if (!this.#saved)
        {
            //add a temporary id - this will not be saved back to the DB at all.
            this.#guid = this._uuidv4();
        }
    }

    //#endregion Constructor


    //#region helper methods

    _uuidv4()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c)
        {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

