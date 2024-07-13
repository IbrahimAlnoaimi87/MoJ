$(document).ready(function ()
{
    if (SourceCode.Forms.Browser.msie)
    {
        var version = SourceCode.Forms.Browser.version;
        var htmlElement = $(document.documentElement);
        if (version.substr(0, 2) === "8.")
        {
            htmlElement.addClass("ie8");
        }
        else if (version.substr(0, 2) === "9.")
        {
            htmlElement.addClass("ie9");
        }
    }

    function queryObj()
    {
        var result = {}, queryString = location.search.slice(1),
            re = /([^&=]+)=([^&]*)/g, m;

        while (m = re.exec(queryString))
        {
            result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }

        return result;
    }

    var returnUrl = queryObj()["ReturnUrl"];

    var stsIssuers = $(".stsAuthMethodLink");

    if (stsIssuers.length > 0)
    {
        stsIssuers.on("click", function ()
        {
            $.ajax({
                type: "POST",
                url: "../_trust/Login.aspx/RedirectToSts",
                data: JSON.stringify({ issuerName: $(this).data("issuername"), returnUrl: returnUrl }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (msg)
                {
                    if (msg.d != "")
                    {
                        window.location.replace(msg.d);
                    }
                },
                error: function (xhr, error)
                {
                    console.log(xhr); console.log(error);
                }
            });
        });
    }
});
