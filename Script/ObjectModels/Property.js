NamespaceUtility.RegisterNamespace("SourceCode.Forms.Designer");

//Purpose:
SourceCode.Forms.Designer.Property = class extends SourceCode.Forms.Designer.EventTarget
{
    //#region Fields

    #name;
    #displayValue;
    #value;
    #control;

    //#endregion Fields

    //#region Properties

    get Name()
    {
        return this.#name;
    }

    get DisplayValue()
    {
        return this.#displayValue;
    }

    set DisplayValue(value)
    {
        if (this.#displayValue  !== value)
        {
            this.#displayValue = value;
            this._setXml();
            this.raisePropertyChanged("DisplayValue");
        }
    }

    get Value()
    {
        return this.#value;
    }

    set Value(value)
    {
        if (this.#value !== value)
        {
            this.#value = value;
            this._setXml();
            this.raisePropertyChanged("Value");
        }
    }

    //#endregion Properties

    //#region Constructor

    constructor(control, name)
    {
        super();
        this.#control = control;
        this.#name = name;
    }

    //#endregion Constructor

    //#region Xml

    fromXml(propertyNode)
    {
        this.#name = propertyNode.selectSingleNode("Name").text;
        this.#value = propertyNode.selectSingleNode("Value").text;

        var displayValueNode = propertyNode.selectSingleNode("DisplayValue");
        if (!!displayValueNode) this.#displayValue = displayValueNode.text;
    }

    //returns new SourceCode.Forms.Designer.Property
    static CreateFromXml(propertyNode)
    {
        var prop = new SourceCode.Forms.Designer.Property();
        prop.fromXml(propertyNode);
        return prop;
    }

    //saves the property back to the form/view definition xml
    _setXml()
    {
        var propertyNode = this._ensureXmlNode();
        
        var valueNode = propertyNode.selectSingleNode("Value");
        var displayValueNode = propertyNode.selectSingleNode("DisplayValue");

        this._setXmlNodeValue(valueNode,this.#value);
        this._setXmlNodeValue(displayValueNode, this.#displayValue);


        //Awkward property which is actually an attribute
        if (this.#name == "Theme")
        {
            this.#control.getXmlNode().setAttribute('Theme', this.#value);
        }
    }


    //This should probably be in an XML helper Class
    _setXmlNodeValue(node, value)
    {
        var textnode = node.ownerDocument.createTextNode(value);
        if (!!node.firstChild) node.firstChild.remove();
        node.appendChild(textnode);
    }

    //ensures that the definition xml has a node for this property
    _ensureXmlNode()
    {
        var propertiesNode = this.#control.Properties.getXmlNode();
        var propertyNode = propertiesNode.selectSingleNode("Property[Name='" + this.Name + "']");
        if (!propertyNode)
        {
            propertyNode = $.parseXML("<Property><Name>" + this.#name + "</Name><Value></Value><DisplayValue></DisplayValue></Property>").selectSingleNode("Property");
            propertyNode = propertiesNode.appendChild(propertyNode);
        }

        return propertyNode;
    }

    //#endregion Xml
} 
