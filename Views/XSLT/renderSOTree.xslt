<?xml version="1.0" encoding="utf-8"?>
<!-- Renders the category tree
Called from the root node or from childnodes and list so's with different parameters-->

<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:msxsl="urn:schemas-microsoft-com:xslt">
	<xsl:output method="html"/>
	<xsl:param name="loc_expandCat"/>
	<xsl:param name="loc_selectSO"/>

	<xsl:param name="catIndent"/>
	<!-- the amount of pixels the text should be indented-->
	<xsl:param name="imgIndent"/>
	<xsl:param name="callType"/>
	<!-- root,children,list-->
	<xsl:param name="imgIncrement"/>
	<xsl:param name="nameIncrement"/>
	<xsl:param name="childNameWidth"/>
	<xsl:param name="nameWidth"/>
	<xsl:param name="parentCat"/>
	<xsl:param name="isLoaded"/>

	<xsl:template match="/">
		<xsl:if test="$callType = 'root'">
			<!--builds a tree from the root node-->
			<xsl:apply-templates select="categories/category">
				<xsl:sort select="metadata/display/displayname"/>
				<xsl:with-param name="thisIndentInfo">
					<indent id="currentImg">
						0
					</indent>
					<indent id="currentName">
						<xsl:value-of select="$imgIncrement"/>
					</indent>
					<indent id="imgIncrement">
						<xsl:value-of select="$imgIncrement"/>
					</indent>
					<indent id="nameIncrement">
						<xsl:value-of select="$nameIncrement"/>
					</indent>
				</xsl:with-param>
				<xsl:with-param name="thisNameWidth" select="$nameWidth"/>
			</xsl:apply-templates>
		</xsl:if>
		<xsl:if test="$callType = 'children'">
			<!--builds the children nodes of a existing parent id-->
			<xsl:apply-templates select="categories/category">
				<xsl:sort select="metadata/display/displayname"/>
				<xsl:with-param name="thisIndentInfo">
					<indent id="currentImg">
						<xsl:value-of select="$imgIndent"/>
					</indent>
					<indent id="currentName">
						<xsl:value-of select="$catIndent"/>
					</indent>
					<indent id="imgIncrement">
						<xsl:value-of select="$imgIncrement"/>
					</indent>
					<indent id="nameIncrement">
						<xsl:value-of select="$nameIncrement"/>
					</indent>
				</xsl:with-param>
				<xsl:with-param name="thisNameWidth" select="$childNameWidth"/>
			</xsl:apply-templates>
			<xsl:apply-templates select="categories/smartobjects/smartobject">
				<xsl:sort select="metadata/display/displayname"/>
				<xsl:with-param name="SOIndent" select="$catIndent"/>
				<xsl:with-param name="ImgIndent" select="$imgIndent"/>
				<xsl:with-param name="thisNameWidth" select="$childNameWidth"/>
			</xsl:apply-templates>
		</xsl:if>
		<xsl:if test="$callType = 'list'">
			<!--builds a list of smartobjects with no category tree-->
			<xsl:apply-templates select="smartobjects/smartobject">
				<xsl:sort select="metadata/display/displayname"/>
				<xsl:with-param name="SOIndent" select="$nameIncrement"/>
				<xsl:with-param name="ImgIndent" select="$imgIndent"/>
				<xsl:with-param name="thisNameWidth" select="$childNameWidth"/>
			</xsl:apply-templates>
		</xsl:if>

	</xsl:template>

	<!--builds the category html with 2 divs (self and container div)-->
	<xsl:template match="category">
		<xsl:param name="thisIndentInfo"/>
		<xsl:param name="thisNameWidth"/>

		<xsl:element name="div">
			<xsl:attribute name="id">
				<xsl:text>VD_</xsl:text>				
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:attribute name="style">
				<xsl:text> overflow:hidden; position:relative; width:99%; margin: 1px; vertical-align: middle</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:text>divNormal</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="textIDs">
				<xsl:text>cat_</xsl:text>
				<xsl:value-of select="@id"/>
				<xsl:text>~</xsl:text>
				<xsl:text>desc_</xsl:text>
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:attribute name="classType">
				<xsl:text>tree</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="display">
				<xsl:value-of select="metadata/display/displayname"/>
			</xsl:attribute>
			<xsl:attribute name="onmouseover">
				<xsl:text>javascript:highlightMyDivPic(this);</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="onmouseout">
				<xsl:text>javascript:normalizeMyDivPic(event,this);</xsl:text>
			</xsl:attribute>			
			<xsl:element name="a">
				<xsl:attribute name="onclick">
					<xsl:text>javascript:showHideCatTree_VD('</xsl:text>
					<xsl:text>childCont_VD_</xsl:text>
					<xsl:value-of select="@id"/>
					<xsl:text>')</xsl:text>
				</xsl:attribute>
				<xsl:attribute name="style">
					<xsl:text>cursor:pointer; vertical-align: middle</xsl:text>
				</xsl:attribute>
				<xsl:element name="img">
					<xsl:attribute name="id">
						<xsl:text>imgCat_VD_</xsl:text>
						<xsl:value-of select="@id"/>
					</xsl:attribute>
					<xsl:attribute name="src">
						<xsl:text>../Images/categories_closed.gif</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:text>position:relative; left:</xsl:text>
						<xsl:value-of select="msxsl:node-set($thisIndentInfo)/indent[@id ='currentImg']"/>
						<xsl:text>px;</xsl:text>
					</xsl:attribute>
					<!--<xsl:attribute name="alt">
						<xsl:value-of select="$loc_expandCat"/>
					</xsl:attribute>-->
					<xsl:attribute name="ondrag">
						<xsl:text>return false;</xsl:text>
					</xsl:attribute>
				</xsl:element>
				<xsl:element name="img">
					<xsl:attribute name="id">
						<xsl:text>imgCatOpen_VD_</xsl:text>
						<xsl:value-of select="@id"/>
					</xsl:attribute>
					<xsl:attribute name="src">
						<xsl:text>../images/categories_open.gif</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:text>position:relative; left:</xsl:text>
						<xsl:value-of select="msxsl:node-set($thisIndentInfo)/indent[@id ='currentImg']"/>
						<xsl:text>px; display:none;</xsl:text>
					</xsl:attribute>
					<!--<xsl:attribute name="alt">
						<xsl:value-of select="$loc_expandCat"/>
					</xsl:attribute>-->
					<xsl:attribute name="ondrag">
						<xsl:text>return false;</xsl:text>
					</xsl:attribute>
				</xsl:element>				
			</xsl:element>
			<xsl:element name="span">
				<xsl:attribute name="id">
					<xsl:text>cat_VD_</xsl:text>
					<xsl:value-of select="@id"/>
				</xsl:attribute>
				<xsl:attribute name="onclick">
					<xsl:text>javascript:showHideCatTree_VD('</xsl:text>
					<xsl:text>childCont_VD_</xsl:text>
					<xsl:value-of select="@id"/>
					<xsl:text>')</xsl:text>
				</xsl:attribute>

				<xsl:attribute name="style">
					<xsl:text>width:100%</xsl:text>
					<xsl:text>;position:absolute; left:</xsl:text>
					<xsl:value-of select="msxsl:node-set($thisIndentInfo)/indent[@id ='currentName']"/>
					<xsl:text>px; cursor:pointer;</xsl:text>
				</xsl:attribute>

				<xsl:attribute name="title">
					<xsl:value-of select="metadata/display/displayname"/>
				</xsl:attribute>
				<xsl:value-of select="metadata/display/displayname"/>
			</xsl:element>
		</xsl:element>
		<xsl:element name="div">
			<xsl:attribute name="id">
				<xsl:text>childCont_VD_</xsl:text>
				<xsl:value-of select="@id"/>
			</xsl:attribute>
			<xsl:if test="count(category) = 0 and count(smartobjects/smartobject) = 0 and $isLoaded != 'true' ">
				<xsl:attribute name="loaded">
					<xsl:text>false</xsl:text>
				</xsl:attribute>
			</xsl:if>
			<xsl:if test="$isLoaded = 'true' ">
				<xsl:attribute name="loaded">
					<xsl:text>true</xsl:text>
				</xsl:attribute>
			</xsl:if>
			<xsl:attribute name="style">
				<xsl:if test="$callType = 'children'">
					<xsl:text>display:none;</xsl:text>
				</xsl:if>
				<xsl:text>position:relative;vertical-align: middle</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="indent">
				<xsl:value-of select="sum(msxsl:node-set($thisIndentInfo)/indent[@id='currentImg' or @id='nameIncrement'])"/>
			</xsl:attribute>
			<xsl:apply-templates select="category">
				<xsl:sort select="metadata/display/displayname"/>
				<xsl:with-param name="thisIndentInfo" >
					<indent id="currentImg">
						<xsl:value-of select="sum(msxsl:node-set($thisIndentInfo)/indent[@id='currentImg' or @id='nameIncrement'])"/>
					</indent>
					<indent id="currentName">
						<xsl:value-of select="sum(msxsl:node-set($thisIndentInfo)/indent[@id='currentName' or @id='imgIncrement'])"/>
					</indent>
					<indent id="imgIncrement">
						<xsl:value-of select="$imgIncrement"/>
					</indent>
					<indent id="nameIncrement">
						<xsl:value-of select="$nameIncrement"/>
					</indent>
				</xsl:with-param>
				<xsl:with-param name="thisNameWidth" select="$childNameWidth"/>
			</xsl:apply-templates>
			<xsl:apply-templates select="smartobjects/smartobject">
				<xsl:sort select="metadata/display/displayname"/>
				<xsl:with-param name="SOIndent" select="sum(msxsl:node-set($thisIndentInfo)/indent[@id='currentName' or @id='imgIncrement'])"/>
				<xsl:with-param name="ImgIndent" select="sum(msxsl:node-set($thisIndentInfo)/indent[@id='currentImg' or @id='nameIncrement'])"/>
				<xsl:with-param name="thisNameWidth" select="$childNameWidth"/>
				<xsl:with-param name="thisCategoryId" select="@id"/>
				<xsl:with-param name="thisCategoryName" select="metadata/display/displayname"/>				
				
			</xsl:apply-templates>
		</xsl:element>
	</xsl:template>

	<!--builds a smartobject html div-->
	<xsl:template match="smartobject">
		<xsl:param name="SOIndent"/>
		<xsl:param name="ImgIndent"/>
		<xsl:param name="thisNameWidth"/>
		<xsl:param name="thisCategoryId"/>
		<xsl:param name="thisCategoryName"/>		

		<xsl:element name="div">
			<xsl:attribute name="style">
				<xsl:text>overflow:hidden; position:relative; width:99%; margin: 1px; vertical-align: middle</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:text>divNormal</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="id">
				<xsl:if test="$callType = 'list'">
					<xsl:text>solist_VD_</xsl:text>
				</xsl:if>
				<xsl:value-of select="guid"/>
			</xsl:attribute>
			<xsl:attribute name="classType">
				<xsl:text>tree</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="callType">
				<xsl:value-of select="$callType"/>
			</xsl:attribute>
			<xsl:if test="$callType = 'list'">
				<xsl:attribute name="parents">
					<xsl:value-of select="categories/category/@parents"/>
				</xsl:attribute>
			</xsl:if>
			<xsl:attribute name="display">
				<xsl:value-of select="metadata/display/displayname"/>
			</xsl:attribute>
			<xsl:attribute name="soguid">
				<xsl:value-of select="guid"/>
			</xsl:attribute>
			<xsl:attribute name="soname">
				<xsl:value-of select="name"/>
			</xsl:attribute>
			<xsl:attribute name="sothisfrn">
				<xsl:value-of select="metadata/display/displayname"/>
			</xsl:attribute>			
			<xsl:attribute name="catid">
				<xsl:value-of select="$thisCategoryId"/>
			</xsl:attribute>
			<xsl:attribute name="catfrn">
				<xsl:value-of select="$thisCategoryName"/>
			</xsl:attribute>
			<xsl:attribute name="onclick">
				<xsl:text>selectSmartObject(this)</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="onmouseover">
				<xsl:text>javascript:highlightMyDivPic(this);</xsl:text>
			</xsl:attribute>
			<xsl:attribute name="onmouseout">
				<xsl:text>javascript:normalizeMyDivPic(event,this);</xsl:text>
			</xsl:attribute>			
			<xsl:element name="a">
				<xsl:attribute name="style">
					<xsl:text>cursor:pointer; vertical-align: middle</xsl:text>
				</xsl:attribute>
				<xsl:element name="img">
					<xsl:attribute name="id">
						<xsl:text>imgSO_VD_</xsl:text>
						<xsl:value-of select="guid"/>
					</xsl:attribute>
					<xsl:attribute name="src">
						<xsl:text>../images/smartobject.gif</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:text>position:relative; left:</xsl:text>
						<xsl:value-of select="$ImgIndent"/>
						<xsl:text>px;</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="ondrag">
						<xsl:text>return false;</xsl:text>
					</xsl:attribute>
				</xsl:element>
			</xsl:element>
			<xsl:element name="span">
				<xsl:attribute name="id">
					<xsl:text>so_VD_</xsl:text>
					<xsl:value-of select="guid"/>
				</xsl:attribute>
				<xsl:attribute name="style">
					<xsl:text>width: 100%; position:absolute; left:</xsl:text>
					<xsl:value-of select="$SOIndent"/>
					<xsl:text>px; cursor:pointer;vertical-align: middle</xsl:text>
				</xsl:attribute>
				<xsl:if test="metadata/display/description != ''">
					<xsl:attribute name="title">
						<xsl:value-of select="metadata/display/description"/>
					</xsl:attribute>
				</xsl:if>				
				<xsl:value-of select="metadata/display/displayname"/>			
			</xsl:element>
		</xsl:element>
	</xsl:template>
</xsl:stylesheet>

