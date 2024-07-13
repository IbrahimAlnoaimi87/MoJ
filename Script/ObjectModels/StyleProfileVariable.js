

if (!SourceCode) SourceCode = {};
if (!SourceCode.Forms) SourceCode.Forms = {};
if (!SourceCode.Forms.Designer) SourceCode.Forms.Designer = {};

var StyleProfileVariable = SourceCode.Forms.Designer.StyleProfileVariable = class extends SourceCode.Forms.Designer.EventTarget
{
    //#region Properties

    get Name()
    {
        return this.#name;
    }

    get Value()
    {
        return this.#value;
    }

    set Value(value)
    {
        this.#value = value;
        this.raisePropertyChanged("Value");
    }

    get Type()
    {
        return this.#type;
    }

    //#endregion

    //#region Fields

    #name;
    #value;
    #type;

    //#endregion

    //#region Constructor

    constructor(name, value, type)
    {
        super();

        this.#name = name;
        this.#value = value;
        this.#type = type;
    }

    //#endregion

    //#region Methods

    Clone()
    {
        return new SourceCode.Forms.Designer.StyleProfileVariable(this.Name, this.Value, this.Type);
    }

    //#endregion Methods

    //#region Json

    toJson()
    {
        var json = "";

        json += "{";
        json += "\"name\":\"" + this.#name + "\"";
        json += ",";
        json += "\"value\":\"" + this.#value + "\"";
        json += ",";
        json += "\"type\":\"" + this.#type + "\"";
        json += "}";

        return json;
    }

    //#endregion Json

    //#region Xml 

    static createFromXml(itemNode)
    {
        var variable = new SourceCode.Forms.Designer.StyleProfileVariable();
        variable.fromXml(itemNode);
        return variable;
    }

    fromXml(itemNode) {
        var name = $sn(itemNode, "Name").text;
        var value = $sn(itemNode, "Value").text;
        var type = $sn(itemNode, "Type").text;
        this.#name = name;
        this.#value = value;
        this.#type = type;
    }

    toXml()
    {
        var xml = "";

        xml += "<Variable>";
        xml += "<Name>" + this.#name + "</Name>";
        xml += "<Value>" + this.#value + "</Value>";
        xml += "<Type>" + this.#type + "</Type>";
        xml += "</Variable>";

        return xml;
    }

    //#endregion
}
