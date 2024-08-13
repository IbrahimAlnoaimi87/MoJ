if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Designer === "undefined" || SourceCode.Forms.Designer === null) SourceCode.Forms.Designer = {};

//Purpose:
SourceCode.Forms.Designer.PropertyCollection = class extends SourceCode.Forms.Designer.ObservableCollection
{
    //#region Fields

    #control;


    //#endregion Fields

    //#region Properties

    //required override from ObservableCollection
    get HashKey()
    {
        return "Name";
    }

    //#endregion Properties

    //#region Constructor

    constructor(control)
    {
        super();

        this.#control = control;
    }

    //#endregion Constructor

    //#region Methods


    Add(property)
    {
        super.Add(property);
    }


    Ensure(propertyName)
    {
        var property = this.Item(propertyName);
        if (!property)
        {
            property = new SourceCode.Forms.Designer.Property(this.#control, propertyName);
            this.Add(property);
        }

        return property;
    }


    //#endregion Methods

    //#region Xml

    //required by ObservableCollection super class to do the xml parsing for us.
    xmlRootElementName()
    {
        return "Properties";
    }

    //required by ObservableCollection super class to do the xml parsing for us.
    fromXmlItem(itemNode)
    {
        var property = new SourceCode.Forms.Designer.Property(this.#control);
        property.fromXml(itemNode);
        return property;
    }

    //get the xml node for this property collection from the form/view definition xml
    getXmlNode()
    {
        return this.#control.getXmlNode().selectSingleNode(this.xmlRootElementName());
    }

    //#endregion Xml
} 
