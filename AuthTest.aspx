<%@ Page Language="C#" AutoEventWireup="true" %>

<%@ Import Namespace="System.IdentityModel.Services" %>
<%@ Import Namespace="System.IdentityModel.Tokens" %>
<%@ Import Namespace="System.Security.Claims" %>
<%@ Import Namespace="System.Security.Principal" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="SourceCode.Hosting.Client.BaseAPI" %>
<%@ Import Namespace="SourceCode.Forms.Client" %>
<%@ Import Namespace="SourceCode.Workflow.Client" %>
<%@ Import Namespace="SourceCode.Forms.Utilities" %>

<!DOCTYPE html>

<html>
<head>
	<title></title>
	<style type="text/css">
		h2 {
			font-size: large;
			padding-top: 0px;
			margin-top: 0px;
		}

		table {
			border-collapse: collapse;
			width: 500px;
		}

		table, td, th {
			border: 1px solid black;
			padding: 2px;
		}

		th {
			text-align: left;
			font-size: small;
		}

		td {
			font-size: smaller;
		}

		div.section {
			width: 100%;
		}

		div.inner {
			border: 1px solid gray;
			border-radius: 5px;
			margin: 10px;
			padding: 20px;
		}
	</style>
	<script runat="server">

		private static string serializeBootstrapToken()
		{
			string retVal = "Empty";

			try
			{
				//Initialize our claims settings
				ClaimsIdentity claimsIdentity = HttpContext.Current.User.Identity as ClaimsIdentity;

				// Get the bootstrap from the claims token (this requires saveBootstrapTokens="true")
				SecurityToken securityToken = null;// = ((BootstrapContext)claimsIdentity.BootstrapContext).SecurityToken;
				BootstrapContext bootStrapContext = (BootstrapContext)claimsIdentity.BootstrapContext;

				if (bootStrapContext != null)
				{
					if (bootStrapContext.SecurityToken != null)
					{
						securityToken = bootStrapContext.SecurityToken;
					}
					else if (!string.IsNullOrEmpty(bootStrapContext.Token))
					{
						var handlers = System.IdentityModel.Services.FederatedAuthentication.FederationConfiguration.IdentityConfiguration.SecurityTokenHandlers;
						using (StringReader stringReader = new StringReader(bootStrapContext.Token))
						using (XmlReader xmlReader = XmlReader.Create(bootStrapContext.Token))
						{
							securityToken = handlers.ReadToken(xmlReader);
						}
					}
				}

				// Check we have a token
				if (securityToken != null)
				{
					// Initialize our XML reading methods so we can write the token to it
					System.Text.StringBuilder stringBuilder = new System.Text.StringBuilder();

					using (System.Xml.XmlWriter xmlWriter = System.Xml.XmlWriter.Create(stringBuilder))
					{
						// Check for SAML1.1 or SAML2 token
						if ((securityToken as SamlSecurityToken) != null)
						{
							// Serialize SAML 1.1 token
							SamlSecurityTokenRequirement tokenRequirement = new SamlSecurityTokenRequirement();
							SamlSecurityTokenHandler tokenHandler = new SamlSecurityTokenHandler(tokenRequirement);
							tokenHandler.WriteToken(xmlWriter, securityToken);
						}
						else if ((securityToken as Saml2SecurityToken) != null)
						{
							// Serialize SAML 2 token
							Saml2SecurityTokenHandler tokenHandler = new Saml2SecurityTokenHandler();
							tokenHandler.WriteToken(xmlWriter, securityToken);
						}
						else
						{
							throw new Exception(string.Format("Token of type {0} not supported", securityToken.GetType().ToString()));
						}

						// Flush XML writer
						xmlWriter.Flush();
						xmlWriter.Close();
					}

					// Get our token string
					retVal = stringBuilder.ToString();
				}

				return retVal;
			}
			catch (Exception ex)
			{
				return ex.Message;
			}
		}

		private void WriteDetails()
		{
			try
			{
				Response.Write("<div class=\"section\">");
				Response.Write("<div class=\"inner\">");
				Response.Write("<h2>HttpContext.Current.User.Identity - Properties</h2>");
				Response.Write("<table>");
				Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
				Response.Write("<tr><td colspan=\"4\">User.Identity</td></tr>");
				Response.Write(string.Format("<tr><td>.IsAuthenticated:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(User.Identity.IsAuthenticated)));
				Response.Write(string.Format("<tr><td>.Name:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(User.Identity.Name)));
				Response.Write(string.Format("<tr><td>.AuthenticationType:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(User.Identity.AuthenticationType)));
				Response.Write(string.Format("<tr><td>.GetType().FullName:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(User.Identity.GetType().FullName)));
				Response.Write("</table>");
				Response.Write("</div>");
				Response.Write("</div>");

				var windowsIdentity = User.Identity as WindowsIdentity;

				if (windowsIdentity != null)
				{
					Response.Write("<div class=\"section\">");
					Response.Write("<div class=\"inner\">");
					Response.Write("<h2>WindowsIdentity - Properties</h2>");
					Response.Write("<table>");
					Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
					Response.Write(string.Format("<tr><td>.ImpersonateLevel:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(windowsIdentity.ImpersonationLevel)));
					Response.Write(string.Format("<tr><td>.Name:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(windowsIdentity.Name)));
					Response.Write(string.Format("<tr><td>.AuthenticationType:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(windowsIdentity.AuthenticationType)));
					Response.Write(string.Format("<tr><td>.Token:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(windowsIdentity.Token)));
					Response.Write("</table>");
					Response.Write("</div>");
					Response.Write("</div>");

					Response.Write("</div>");
					Response.Write("</div>");
					Response.Write("<div class=\"section\">");
					Response.Write("<div class=\"inner\">");
					Response.Write("<h2>WindowsIdentity - BaseAPIConnection</h2>");

					try
					{
						using (var impersonationContext = windowsIdentity.Impersonate())
						{
							var csb = new SCConnectionStringBuilder();
							var api = new BaseAPI();

							api.CreateConnection();
							csb.Host = "localhost";
							csb.Port = 5555;
							csb.Authenticate = true;
							csb.IsPrimaryLogin = true;
							csb.Integrated = true;

							var connection = api.Connection;

							connection.Open(csb.ToString());

							Response.Write("<table>");
							Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
							Response.Write("<tr><td>Properties</td><td>Value</td></tr>");
							Response.Write(string.Format("<tr><td>Connection.Host:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.Host)));
							Response.Write(string.Format("<tr><td>Connection.Port:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.Port)));
							Response.Write(string.Format("<tr><td>Connection.IsAuthenticated:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.IsAuthenticated)));
							Response.Write(string.Format("<tr><td>Connection.IsConnected:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.IsConnected)));
							Response.Write(string.Format("<tr><td>Connection.IsPrimaryLogin:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.IsPrimaryLogin)));
							Response.Write(string.Format("<tr><td>Connection.Integrated:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.Integrated)));
							Response.Write(string.Format("<tr><td>Connection.AuthData:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.AuthData)));
							Response.Write(string.Format("<tr><td>Connection.SecurityLabelName:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.SecurityLabelName)));
							Response.Write("</table>");
							Response.Write("<br/>");
							Response.Write("<br/>");
							Response.Write("<h2>IClaimsIdentity - Workflow Client Connection</h2>");

							var setup = new ConnectionSetup();
							var wfc = new Connection();
							var client = new FormsClient();

							csb.Port = 5252;
							setup.ConnectionString = csb.ToString();
							wfc.Open(setup);
							client.Connection = connection;

							Response.Write("<table>");
							Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
							Response.Write("<tr><td>Properties</td><td>Value</td></tr>");
							Response.Write(string.Format("<tr><td>wfc.User.Description:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Description)));
							Response.Write(string.Format("<tr><td>wfc.User.DisplayName:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.DisplayName)));
							Response.Write(string.Format("<tr><td>wfc.User.Email:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Email)));
							Response.Write(string.Format("<tr><td>wfc.User.FQN:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.FQN)));
							Response.Write(string.Format("<tr><td>wfc.User.Manager:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Manager)));
							Response.Write(string.Format("<tr><td>wfc.User.Name:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Name)));
							Response.Write(string.Format("<tr><td>wfc.User.UserLabel:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.UserLabel)));
							Response.Write("</table>");
							Response.Write("<br/>");
							Response.Write("<br/>");
							Response.Write("<h2>WindowsIdentity - FormsClient.User</h2>");
							Response.Write("<table>");
							Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
							Response.Write("<tr><td>Properties</td><td>Value</td></tr>");
							Response.Write(string.Format("<tr><td>Client.User.FQN:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.FQN)));
							Response.Write(string.Format("<tr><td>Client.User.DisplayName:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.DisplayName)));
							Response.Write(string.Format("<tr><td>Client.User.Description:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Description)));
							Response.Write(string.Format("<tr><td>Client.User.Email:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Email)));
							Response.Write(string.Format("<tr><td>Client.User.Domain:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Domain)));
							Response.Write(string.Format("<tr><td>Client.User.Manager:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Manager)));
							Response.Write(string.Format("<tr><td>Client.User.Name:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Name)));
							Response.Write(string.Format("<tr><td>Client.User.SecurityLabel:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.SecurityLabel)));
							Response.Write("</table>");
						}
					}
					catch (Exception ex)
					{
						Response.Write(HttpUtility.HtmlEncode(ex.ToString()).Replace(Environment.NewLine, "<br/>"));
					}
					Response.Write("</div>");
					Response.Write("</div>");
				}
				var claimsIdentity = User.Identity as ClaimsIdentity;

				if (claimsIdentity != null)
				{
					Response.Write("<div class=\"section\">");
					Response.Write("<div class=\"inner\">");
					Response.Write("<h2>ClaimsIdentity - Properties</h2>");
					Response.Write("<table>");
					Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
					Response.Write(string.Format("<tr><td>.Label:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(claimsIdentity.Label)));
					Response.Write(string.Format("<tr><td>.Name:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(claimsIdentity.Name)));
					Response.Write(string.Format("<tr><td>.NameClaimType:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(claimsIdentity.NameClaimType)));
					Response.Write(string.Format("<tr><td>.RoleClaimType:</td><td>{0}</td></tr>\n", HttpUtility.HtmlEncode(claimsIdentity.RoleClaimType)));
					Response.Write(string.Format("<tr><td>.Claims.Count:</td><td>{0}</td></tr>\n", claimsIdentity.Claims.Count()));
					Response.Write("</table>");
					Response.Write("</div>");
					Response.Write("</div>");

					Response.Write("<div class=\"section\">");
					Response.Write("<div class=\"inner\">");
					Response.Write("<h2>ClaimsIdentity - Claims</h2>");
					Response.Write("<table>");
					Response.Write("<tr><th>ClaimType</th><th>Value</th><th>Issuer</th><th>OriginalIssuer</th><th>ValueType</th><th>Subject</th><th>Properties</th></tr>");

					for (int index = 0; index < claimsIdentity.Claims.Count(); index++)
					{
						var claim = claimsIdentity.Claims.ElementAt(index);

						Response.Write(string.Format("<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td><td>{5}</td><td></td></tr>",
							HttpUtility.HtmlEncode(claim.Type), HttpUtility.HtmlEncode(claim.Value), HttpUtility.HtmlEncode(claim.Issuer), HttpUtility.HtmlEncode(claim.OriginalIssuer), HttpUtility.HtmlEncode(claim.ValueType), HttpUtility.HtmlEncode(claim.Subject)));
					}

					Response.Write("</table>");
					Response.Write("</div>");
					Response.Write("</div>");

					Response.Write("<div class=\"section\">");
					Response.Write("<div class=\"inner\">");
					Response.Write("<h2>ClaimsIdentity.BootstrapToken</h2>");

					if (claimsIdentity.BootstrapContext != null)
					{
						var bootstrapTokenTest = (claimsIdentity.BootstrapContext as BootstrapContext);
						if (bootstrapTokenTest != null)
						{
							var bootstrapToken = bootstrapTokenTest.SecurityToken;
							if (bootstrapToken != null)
							{
								Response.Write(string.Format("claimsIdentity.BootstrapToken.Id: {0}<br/>\n", HttpUtility.HtmlEncode(bootstrapToken.Id)));
								Response.Write(string.Format("claimsIdentity.BootstrapToken.Valid From: {0}<br/>\n", HttpUtility.HtmlEncode(bootstrapToken.ValidFrom.ToLocalTime().ToString("u"))));
								Response.Write(string.Format("claimsIdentity.BootstrapToken.Valid To: {0}<br/>\n", HttpUtility.HtmlEncode(bootstrapToken.ValidTo.ToLocalTime().ToString("u"))));
								Response.Write(string.Format("claimsIdentity.BootstrapToken.SecurityKeys.Count: {0}<br/>\n", HttpUtility.HtmlEncode(bootstrapToken.SecurityKeys.Count)));

								for (int index = 0; index < bootstrapToken.SecurityKeys.Count; index++)
								{
									Response.Write(string.Format("&nbsp;&nbsp;.SecurityKeys[{0}]<br/>\n", index));
									Response.Write(string.Format("&nbsp;&nbsp;&nbsp;&nbsp;.KeySize: {0}<br/>\n", HttpUtility.HtmlEncode(bootstrapToken.SecurityKeys[index].KeySize), index));
									Response.Write(string.Format("&nbsp;&nbsp;&nbsp;&nbsp;.GetType().FullName: {0}<br/>\n", HttpUtility.HtmlEncode(bootstrapToken.SecurityKeys[index].GetType().FullName), index));
								}

								Response.Write(string.Format("claimsIdentity.BootstrapToken.ToString(): {0}<br/>\n", bootstrapToken.ToString()));
								Response.Write("<br/>");
								Response.Write("<textarea cols=\"50\" rows=\"5\">" + Server.HtmlEncode(serializeBootstrapToken()) + "</textarea>");
							}
							else
							{
								Response.Write(string.Format("claimsIdentity.BootstrapContext can't be shown<br/>\n"));
							}

						}
						else
						{
							Response.Write(string.Format("claimsIdentity.BootstrapContext can't be shown<br/>\n"));
						}
					}
					else
					{
						Response.Write(string.Format("claimsIdentity.BootstrapToken: null<br/>\n"));
					}

					Response.Write("</div>");
					Response.Write("</div>");
					Response.Write("<div class=\"section\">");
					Response.Write("<div class=\"inner\">");
					Response.Write("<h2>ClaimsIdentity - BaseAPIConnection</h2>");

					try
					{
						var csb = new SCConnectionStringBuilder();
						var api = new BaseAPI();

						api.CreateConnection();
						csb.Host = "localhost";
						csb.Port = 5555;
						csb.Authenticate = true;
						csb.IsPrimaryLogin = true;
						csb.Integrated = true;

						var connection = api.Connection;

						connection.Open(csb.ToString());

						Response.Write("<table>");
						Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
						Response.Write("<tr><td>Properties</td><td>Value</td></tr>");
						Response.Write(string.Format("<tr><td>Connection.Host:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.Host)));
						Response.Write(string.Format("<tr><td>Connection.Port:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.Port)));
						Response.Write(string.Format("<tr><td>Connection.IsAuthenticated:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.IsAuthenticated)));
						Response.Write(string.Format("<tr><td>Connection.IsConnected:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.IsConnected)));
						Response.Write(string.Format("<tr><td>Connection.IsPrimaryLogin:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.IsPrimaryLogin)));
						Response.Write(string.Format("<tr><td>Connection.Integrated:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.Integrated)));
						Response.Write(string.Format("<tr><td>Connection.AuthData:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.AuthData)));
						Response.Write(string.Format("<tr><td>Connection.SecurityLabelName:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(connection.SecurityLabelName)));
						Response.Write("</table>");
						Response.Write("<br/>");
						Response.Write("<br/>");
						Response.Write("<h2>IClaimsIdentity - Workflow Client Connection</h2>");

						var setup = new ConnectionSetup();
						var wfc = new Connection();
						var client = new FormsClient();

						csb.Port = 5252;
						setup.ConnectionString = csb.ToString();
						wfc.Open(setup);
						client.Connection = connection;

						Response.Write("<table>");
						Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
						Response.Write("<tr><td>Properties</td><td>Value</td></tr>");
						Response.Write(string.Format("<tr><td>wfc.User.Description:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Description)));
						Response.Write(string.Format("<tr><td>wfc.User.DisplayNamw:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.DisplayName)));
						Response.Write(string.Format("<tr><td>wfc.User.Email:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Email)));
						Response.Write(string.Format("<tr><td>wfc.User.FQN:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.FQN)));
						Response.Write(string.Format("<tr><td>wfc.User.Manager:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Manager)));
						Response.Write(string.Format("<tr><td>wfc.User.Name:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.Name)));
						Response.Write(string.Format("<tr><td>wfc.User.UserLabel:</td><td>{0}<br/>", HttpUtility.HtmlEncode(wfc.User.UserLabel)));
						Response.Write("</table>");
						Response.Write("<br/>");
						Response.Write("<br/>");
						Response.Write("<h2>IClaimsIdentity - FormsClient.User</h2>");
						Response.Write("<table>");
						Response.Write("<colgroup><col width=\"35%\"><col width=\"65%\"/></colgroup>");
						Response.Write("<tr><td>Properties</td><td>Value</td></tr>");
						Response.Write(string.Format("<tr><td>Client.User.FQN:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.FQN)));
						Response.Write(string.Format("<tr><td>Client.User.DisplayName:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.DisplayName)));
						Response.Write(string.Format("<tr><td>Client.User.Description:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Description)));
						Response.Write(string.Format("<tr><td>Client.User.Email:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Email)));
						Response.Write(string.Format("<tr><td>Client.User.Domain:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Domain)));
						Response.Write(string.Format("<tr><td>Client.User.Manager:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Manager)));
						Response.Write(string.Format("<tr><td>Client.User.Name:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.Name)));
						Response.Write(string.Format("<tr><td>Client.User.SecurityLabel:</td><td>{0}</td></tr>", HttpUtility.HtmlEncode(client.User.SecurityLabel)));
						Response.Write("</table>");
					}
					catch (Exception ex)
					{
						Response.Write(HttpUtility.HtmlEncode(ex.ToString()).Replace(Environment.NewLine, "<br/>"));
					}
					Response.Write("</div>");
					Response.Write("</div>");
				}
			}
			catch (Exception ex)
			{
				Response.Write(HttpUtility.HtmlEncode(ex.ToString()).Replace(Environment.NewLine, "<br/>"));
			}
		}

	</script>
</head>
<body>
	<form id="form1" runat="server">
		<div>
			<%

				WriteDetails();

			%>
		</div>
	</form>
</body>
</html>
