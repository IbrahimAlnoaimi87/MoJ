if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designer === "undefined" || SourceCode.Forms.Designer === null) SourceCode.Forms.Designer = {};


SourceCode.Forms.Designer.ControlCollection = class extends SourceCode.Forms.Designer.ObservableCollection 
{
    //#region Fields

    #controlsLoaded = false;

    //#endregion Fields

    //#region Properties

    //required Override if Collection.Items(String) is to be used to get an item
    get HashKey()
    {
        return "id";
    }

    //#endregion Properties

    //#region Constructor

    constructor()
    {
        super();
    }

    //#endregion Constructor

    //#region Methods

    //override ObservableCollection

    Item(nameOrIndex)
    {
        this._ensureControlsLoaded();
        var control = super.Item(nameOrIndex);

        //attempt to get from XML - migth be a newly added control, since the xml was first loaded.
        if (control == null && typeof (nameOrIndex=="string")) control = this._loadControlById(nameOrIndex);

        return control;
    }

    //#endregion Methods

    //#region Xml and Caching


    _ensureControlsLoaded()
    {
        if (!this.#controlsLoaded) this._loadControls();
    }

    _loadControlById(controlId)
    {
        var common = SourceCode.Forms.Designers.Common;
        var xml = common.getDefinitionXML();
        
        if (!!xml)
        {
            var xpathControl = common.getContextXPath() + "/Controls/Control[@ID='" + controlId + "']";
            var controlNode = xml.selectSingleNode(xpathControl);
            if (!!controlNode)
            {
                var controlObjectModel = new SourceCode.Forms.Designer.Control(controlNode);
                this.Add(controlObjectModel);
                return controlObjectModel;
            }
        }

        //create a control with the GUID
        //this is particularly needed for new Forms/Views where the XML isn't built yet.
        if (checkExistsNotEmpty(controlId))
        {
            var controlObjectModel = new SourceCode.Forms.Designer.Control();
            controlObjectModel.ID = controlId;
            this.Add(controlObjectModel);
            return controlObjectModel;
        }
    }

    //loads all controls into the collection
    _loadControls()
    {
        var common = SourceCode.Forms.Designers.Common;
        this.Clear(); //empty the hash

        var xml = common.getDefinitionXML();
        var xpathAllControls = common.getContextXPath() + "/Controls/Control";

        if (!!xml)
        {
            var controlsToAdd = [];

            var controlNodes = xml.selectNodes(xpathAllControls);
            for (var i = 0; i < controlNodes.length; i++)
            {
                var controlNode = controlNodes[i];
                controlsToAdd.push(new SourceCode.Forms.Designer.Control(controlNode));
            }
            this.AddRange(controlsToAdd);
        }
        this.#controlsLoaded = true;
    }

    //required by ObservableCollection super class to do the xml parsing for us.
    xmlRootElementName()
    {
        return "Controls";
    }

    //required by ObservableCollection super class to do the xml parsing for us.
    fromXmlItem(itemNode)
    {
        var property = new SourceCode.Forms.Designer.Control();
        property.fromXml(itemNode);
        return property;
    }

   

    //#endregion Xml and Caching
} 
