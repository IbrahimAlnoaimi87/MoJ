if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designer === "undefined" || SourceCode.Forms.Designer === null) SourceCode.Forms.Designer = {};

//Singleton
var ControlManager = SourceCode.Forms.Designer._ControlManager = class 
{
    //#region Properties

    get Controls()
    {
        return this.#controls;
    }

    //#endregion Properties

    //#region Fields

    #controls; //a SourceCode.Forms.Designer.ControlCollection

    //#endregion Fields

    //#region Constructor

    constructor()
    {
        //super();
        this.#controls = new SourceCode.Forms.Designer.ControlCollection();

        this.#controls.attachEventListener("CollectionChanged", this._controlsCollectionChanged.bind(this));

        //TODO: bind into DesignerChanged Event - to cleanout the controls and start again.
        SourceCode.Forms.Designers.Common.registerForEvent("DesignerChanged", this._designerChanged.bind(this));
    }

    //#endregion

    //#region Methods

    _designerChanged(ev)
    {
        console.log("ControlManager - designerChanged");
    }

    _controlsCollectionChanged(ev)
    {
        console.log("ControlManager - controlsCollectionChanged");
    }

    //#endregion Methods

    //#region Control Instances

    //deprecated - needed for working with legacy js view/form code. 
    //public accessor
    getControlObjectModelFromElement(jqElement)
    {
        return this._getControlObjectModelFromElement(jqElement);
    }

    //deprecated - needed for working with legacy js view/form code.
    //This is a way to start passing around Object models before moving to Angular fully.
    _getControlObjectModelFromElement(jqElement)
    {
        var common = SourceCode.Forms.Designers.Common;
        var controlObjectModel = {};
        if (!checkExists(jqElement) || jqElement.length === 0)
        {
            controlObjectModel = new SourceCode.Forms.Designer.Control();
        }
        else
        {
            var controlType = common.getControlTypeFromElement(jqElement);
            var id = jqElement.attr('id');
            if (controlType === "Form")
            {
                id = common.Context.getDesigner().id; // _formDesigner.id;
            }
            if (controlType.toLowerCase() === 'areaitem')
            {
                var id = jqElement.attr('instanceid');
            }

            var controlNode = common.getControlNode(id);
            controlObjectModel = new SourceCode.Forms.Designer.Control(controlNode, jqElement);

            //NOTE: this should rather pull from common.ControlDefinitionXML
            // TODO: replace this with a Control.js (ControlInstance) object model.
            //controlObjectModel = {
            //    id: id,
            //    name: controlType,
            //    fullName: controlType.toLowerCase(),
            //    type: ControlTypeManager.getControlTypeObjectModelFromControlType(controlType),
            //    controlType: controlType.toLowerCase(),
            //    controlTypeCaseSensitive: controlType,
            //    layoutType: jqElement.attr('layouttype'),
            //    element: jqElement,
            //    visualElement: visualElement,
            //    resizeWrapper: resizeWrapper,
            //    properties: SourceCode.Forms.Designer.Control.getControlInstancePropertiesObjectModelFromControl(controlNode)
            //};
        }
        return controlObjectModel;
    }

    //#endregion 

    //#region Xml - Control Caching

    GetControlXmlNode(control)
    {
        var common = SourceCode.Forms.Designers.Common;
        var xml = common.getDefinitionXML();
        var xpathAllControls = common.getContextXPath() + "/Controls/Control";
        var xpathForControl = xpathAllControls + "[@ID='" + control.ID + "']";

        return xml.selectSingleNode(xpathForControl);
    }

    //#endregion Xml - Control Caching
}

SourceCode.Forms.Designer.ControlManager = new SourceCode.Forms.Designer._ControlManager();



