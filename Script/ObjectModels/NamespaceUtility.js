

//singleton
class NamespaceUtility
{
    static RegisterNamespace(strNamespace)
    {
        var segments = strNamespace.trim().split(".");
        var prevObject = window;
        for (var i = 0; i < segments.length; i++)
        {
            var segment = segments[i];
            var obj = prevObject[segment];
            prevObject = (typeof (obj) == "undefined" || obj == null) ? prevObject[segment] = {} : obj;
        }
    }
}
