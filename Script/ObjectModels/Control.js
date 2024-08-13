if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designer === "undefined" || SourceCode.Forms.Designer === null) SourceCode.Forms.Designer = {};

//Purpose: Control Instances
var Control = SourceCode.Forms.Designer.Control = class extends SourceCode.Forms.Designer.EventTarget
{
    //#region Constructor

    constructor(controlNode, element)
    {
        super();

        this.#properties = new SourceCode.Forms.Designer.PropertyCollection(this);
        this.#properties.attachEventListener("CollectionChanged", this._propertiesCollectionChanged.bind(this));

        //TODO: copy options to instance fields (id, name, etc)
        if (!!controlNode)
        {
            this.fromXml(controlNode);
        }

        //to be deprecated
        //element is used for visualElement and resizeWrapper properties, which canvas Widgets use.
        this.element = element;
    }

    //#endregion Constructor

    //#region Fields

    #id;
    #type;
    #layoutType;
    #properties;

    //#endregion Fields

    //#region Properties

    get ID()
    {
        return this.#id;
    }

    set ID(value)
    {
        this.#id = value;
        this.raisePropertyChanged("ID");
    }

    //SourceCode.Forms.Designer.ControlType object model
    get Type()
    {
        return this.#type;
    }


    set Type(value)
    {
        this.#type = value;
        this.raisePropertyChanged("Type");
    }


    get LayoutType()
    {
        return this.#layoutType;
    }

    set LayoutType(value)
    {
        this.#layoutType = value;
        this.raisePropertyChanged("LayoutType");
    }

    //an instance of SourceCode.Forms.Designer.PropertyCollection
    get Properties()
    {
        return this.#properties;
    }

  

    //the name property if there is one!
    get Name()
    {
        return this.Properties.Item("ControlName").Value;
    }

   
    //#endregion Properties

    //#region Legacy Properties
    //mostly lowercase properties primarilly used by canvaswidgets and other consumers of designer.common's controlObjectModels.

    get id()
    {
        return this.ID
    }

    set id(value)
    {
        this.ID = value;
    }

    //SourceCode.Forms.Designer.ControlType object model
    get type()
    {
        return this.Type;
    }

    //SourceCode.Forms.Designer.ControlType object model
    set type(value)
    {
        this.Type = value;
    }

    get layoutType()
    {
        return this.LayoutType;
    }

    set layoutType(value)
    {
        this.LayoutType = value;
    }

    //Legacy property
    get name()
    {
        return this.type.name;
    }

    //Legacy property
    get fullName()
    {
        return this.type.name.toLowerCase();
    }

    //Legacy property
    get controlType()
    {
        return this.Type.name.toLowerCase();
    }

    //Legacy property
    get controlTypeCaseSensitive()
    {
        return this.Type.name;
    }

    get propertiesHash()
    {
        throw "propertiesHash is deprected on SourceCode.Forms.Designer.Control.js, please use properties";
        return null;
    }

     //#endregion Legacy Properties

    //#region Legacy UI Properties (to be removed)
    //primarilly used by canvaswidgets and other consumers of designer.common's controlObjectModels.

    element; //deprecated - this shouldn't be in the model! Maybe in a UI Helper

    get resizeWrapper()
    {
        return (this.controlType === 'cell' || this.controlType === 'view') ? null : this.element.find('.resizewrapper').first();
    }

    get visualElement()
    {
        Control.getVisualElementFromControlElement(this.element);
    }


    /*  id: id,
        name: controlType,
        fullName: controlType.toLowerCase(),
        type: common.getControlTypeObjectModelFromControlType(controlType),
        controlType: controlType.toLowerCase(),
        controlTypeCaseSensitive: controlType,
        layoutType: jqElement.attr('layouttype'),
        element: jqElement,
        visualElement: visualElement,
        resizeWrapper: resizeWrapper,
        properties: this._getControlInstancePropertiesObjectModelFromControl(controlNode)
    */

    //#endregion Legacy UI Properties (to be removed)

    //#region Legacy UI Helpers
    //primarilly used by canvaswidgets and other consumers of designer.common's controlObjectModels.

    //helper for _getControlObjectModelFromElement
    static getControlTypeFromElement(jqElement)
    {
        var controlType = "";
        var controlTypeData = jqElement.data("type");
        if (checkExists(controlTypeData))
        {
            controlType = controlTypeData;
        }
        else
        {
            var controlTypeAttr = jqElement.attr("controlType");
            if (checkExists(controlTypeAttr)) controlType = controlTypeAttr.toLowerCase();
        }
        if (jqElement.is(".view-canvas")) controlType = 'viewinstance';
        if (jqElement.is("#CanvasPane") || jqElement.is(".tab-content-wrapper")) controlType = 'Form';

        return controlType;
    }

    //helper for _getControlObjectModelFromElement
    static getVisualElementFromControlElement(jqElement)
    {
        //some control elements are not the item a selection loop sould go around.
        //example: when a view is selected ona form, the view-canvas is clicked on, but its the panel
        //         directly inside that that needs the loop and other widgets.
        var result = jqElement;

        if (jqElement.is(".view-canvas"))
        {
            var innerviewpanel = jqElement.find(">.panel");
            if (innerviewpanel.length === 1) result = innerviewpanel;
        }

        if (jqElement.attr("controltype") === "Table") 
        {
            var resizeWrapper = jqElement.find(">.resizewrapper");
            if (resizeWrapper.length === 1)
            {
                var tableElement = resizeWrapper.find(">.editor-table");
                if (tableElement.length === 1) result = tableElement;
            }
        }

        return result;
    }

    //#endregion

    //#region Methods

    //Respond to model changes
    //Goal: Make it easier from outside this class to respond to Control Instance property
    //      changes, without having to know about the underlying collection.
    _propertiesCollectionChanged(ev)
    {
        ev.NewItems.forEach(function (property)
        {
            //add binding
            property.attachEventListener("PropertyChanged", function (ev)
            {
                this._onControlPropertyChanged(ev, property);
            }.bind(this));
        }.bind(this));

        ev.OldItems.forEach(function (property)
        {
            //remove binding?
            //TODO: make sure when a property is removed the ControlPropertyChanged event is triggered
            //      as this will happen when the user clears a value in the properties panel.
        }.bind(this));
    }

    //Goal: Make it easier from outside this class to respond to Control Instance property
    //      changes, without having to know about the underlying collection.
    //      Notify when a property is added to the control (when someone fills in a blank property)
    //      Notify When a property is removed (user blanks out a value in say the properties panel)
    //      Notify when a property is updated - it already existed, but the uer changed a value.
    //Param: ev : PropertyChangedEventArgs (which property of a Property object has changed - Value, Name, DisplayValue)
    //Param: property: which property object has changed
    _onControlPropertyChanged(ev, property)
    {
        //Bespoke ControlPropertyChangedEventArgs
        var event = new Event("ControlPropertyChanged");
        event.Control = this;
        event.PropertyName = property.Name;
        event.InnerPropertyName = ev.PropertyName;

        this.dispatchEvent(event);
    }

    //Param: Property : SourceCode.Forms.Designer.Property
     _raiseControlPropertyChanged(property)
    {

    }

    //#endregion Methods

    //#region XML

    //construct from a ControlNode in the xml
    fromXml(controlNode)
    {
        this.#id = controlNode.getAttribute("ID");
        this.#type = controlNode.getAttribute("Type");
        this.#properties.fromXml(controlNode);
    }   

    //returns a reference to the Control's Xml Node in the main XmlDefinition
    getXmlNode()
    {
        return SourceCode.Forms.Designer.ControlManager.GetControlXmlNode(this);
    }

    //#endregion Xml
}
