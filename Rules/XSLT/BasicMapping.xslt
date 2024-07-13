<?xml version="1.0" encoding="utf-8"?>
<!-- Accept: To make a droppable only accept certain drag items, add the Accept attribute with the value being the drag item's class name -->

<xsl:transform version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:exslt="http://exslt.org/common"
  xmlns:msxsl="urn:schemas-microsoft-com:xslt"
  exclude-result-prefixes="exslt msxsl">

  <xsl:output method="xml" indent="no"/>
  <xsl:output omit-xml-declaration="yes"/>

  <xsl:param name="Controls"/>
  <xsl:param name="Fields"/>
  <xsl:param name="Methods"/>
  <xsl:param name="Parameters"/>
  <xsl:param name="InputProperties"/>
  <xsl:param name="ReturnProperties"/>
  <xsl:param name="Display" />
  <xsl:param name="Edit" />
  <xsl:param name="Header" />
  <xsl:param name="Footer" />
  <xsl:param name="ResultName"/>
  <xsl:param name="SubFormID" />
  <xsl:param name="ControlMethodParameters"/>
  <xsl:param name="ControlMethodProperties"/>

  <xsl:template match="/">
    <xsl:choose>
      <xsl:when test="string-length($ResultName) > 0">
        <xsl:apply-templates select="/Item/Items[@ResultName = $ResultName]"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="/Item/Items"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="Items">
    <xsl:element name="Items">

      <!-- Form plugin -->
      <xsl:apply-templates select="Item[@ItemType='Form']">
        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
      </xsl:apply-templates>

      <!-- View plugin -->
      <xsl:apply-templates select="Item[@ItemType='View']">
        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
      </xsl:apply-templates>

      <!-- Process plugin -->
      <xsl:apply-templates select="Item[@ItemType='ProcessFolder']">
        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
      </xsl:apply-templates>

      <!-- Object plugin -->
      <xsl:apply-templates select="Item[@ItemType='Object']">
        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
      </xsl:apply-templates>

      <!-- Settings plugin -->
      <xsl:apply-templates select="Item[@ItemType='Setting']">
        <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
      </xsl:apply-templates>
    </xsl:element>
  </xsl:template>

  <!-- Form Template -->
  <xsl:template match="Item[@ItemType='Form']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:text>form</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
      <xsl:choose>
        <xsl:when test="Items/Item">
          <xsl:element name="Items">
            <xsl:if test="Items/Item[@ItemType='Control' and @SubType='AreaItem']">
              <xsl:apply-templates select="Items/Item[@ItemType='Control' and @SubType='AreaItem']">
                <!--<xsl:with-param name="InstanceID" select="$InstanceID" />-->
              </xsl:apply-templates>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType='ControlProperty']">
              <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty']" mode="category">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
              </xsl:apply-templates>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType='AreaItem']">
              <xsl:apply-templates select="Items/Item[@ItemType='AreaItem']">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
              </xsl:apply-templates>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType='FormParameter']">
              <xsl:element name="Item">
                <xsl:attribute name="Icon">
                  <xsl:text>parameters</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="Grouping">
                  <xsl:text>FormParameters</xsl:text>
                </xsl:attribute>
                <xsl:element name="DisplayName">
                  <xsl:value-of select="$Parameters"/>
                </xsl:element>
                <xsl:element name="Items">
                  <xsl:apply-templates select="Items/Item[@ItemType='FormParameter']">
                    <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                  </xsl:apply-templates>
                </xsl:element>
              </xsl:element>
            </xsl:if>
            <xsl:if test="Items/Item[(@ItemType='Control') and (@SubType!='AreaItem')]">
              <xsl:element name="Item">
                <xsl:attribute name="Icon">
                  <xsl:text>controls</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="Grouping">
                  <xsl:text>Controls</xsl:text>
                </xsl:attribute>
                <xsl:element name="DisplayName">
                  <xsl:value-of select="$Controls"/>
                </xsl:element>
                <xsl:element name="Items">
                  <xsl:apply-templates select="Items/Item[@ItemType='Control']">
                    <xsl:with-param name="InstanceID" select="$InstanceID" />
                  </xsl:apply-templates>
                </xsl:element>
              </xsl:element>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType='FormEvent']/Items/Item">
              <xsl:apply-templates select="Items/Item[@ItemType='FormEvent']">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
              </xsl:apply-templates>
            </xsl:if>
            <xsl:apply-templates select="Items/Item[@ItemType='View']">
              <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
            </xsl:apply-templates>
          </xsl:element>
        </xsl:when>
        <xsl:otherwise>
          <xsl:element name="Items">
            <xsl:element name="Item">
              <xsl:attribute name="Icon">
                <xsl:text>form</xsl:text>
              </xsl:attribute>
              <xsl:element name="DispayName">
                <xsl:text>No Items to display</xsl:text>
              </xsl:element>
              <xsl:element name="Name">
                <xsl:text>No Items to display</xsl:text>
              </xsl:element>
            </xsl:element>
          </xsl:element>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:element>
  </xsl:template>

  <!--Form Event-->
  <xsl:template  match="Items/Item[@ItemType='FormEvent']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>form-event</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes"/>
      <xsl:element name="Items">
        <xsl:element name="Item">
          <xsl:element name="DisplayName">
            <xsl:value-of select="$Parameters"/>
          </xsl:element>
          <xsl:element name="Items">
            <xsl:apply-templates select="Items/Item[@ItemType='MethodParameter']">
              <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
              <xsl:with-param name="InstanceID" select="$InstanceID"/>
            </xsl:apply-templates>
          </xsl:element>
        </xsl:element>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- New Process Template-->
  <xsl:template name="AddWIIcon">
    <xsl:attribute name="Icon">
      <xsl:if test="@ItemType='ProcessFolder'">
        <xsl:text>workflows</xsl:text>
      </xsl:if>
      <xsl:if test="@ItemType='Process'">
        <xsl:text>workflow</xsl:text>
      </xsl:if>
      <xsl:if test="@ItemType='ProcessProperty' or @ItemType='ActivityProperty'">
        <xsl:if test="Name='Folio' or Name='SerialNumber' or Name='Name' or Name='DisplayName' or Name='Data' or Name='Description' or Name='Instructions' or Name='ViewFlow' or Name='OriginatorName' or Name='OriginatorDisplayName' or Name='OriginatorDescription' or Name='OriginatorLabel' or Name='OriginatorFQN'">
          <xsl:text>text</xsl:text>
        </xsl:if>
        <xsl:if test="Name='Priority' or Name='ExpectedDuration' or Name='ID'">
          <xsl:text>number</xsl:text>
        </xsl:if>
        <xsl:if test="Name='ActionName'">
          <xsl:text>workflow-action-name</xsl:text>
        </xsl:if>
        <xsl:if test="Name='Guid'">
          <xsl:text>guid</xsl:text>
        </xsl:if>
        <xsl:if test="Name='StartDate'">
          <xsl:text>datetime</xsl:text>
        </xsl:if>
        <xsl:if test="Name='Originator' or Name='OriginatorManager'">
          <xsl:text>user</xsl:text>
        </xsl:if>
        <xsl:if test="Name='OriginatorEmail'">
          <xsl:text>mail</xsl:text>
        </xsl:if>
        <xsl:if test="Name='OriginatorManagedUsers'">
          <xsl:text>group</xsl:text>
        </xsl:if>
      </xsl:if>
      <xsl:if test="@ItemType='Result' and Name='getworkflowactions' ">
        <xsl:text>workflow-actions</xsl:text>
      </xsl:if>
      <xsl:if test="@ItemType='ProcessDataField' or @ItemType='ActivityDataField'">
        <xsl:text>data-field</xsl:text>
      </xsl:if>
      <xsl:if test="@ItemType='ProcessXmlField' or @ItemType='ActivityXmlField' or @ItemType='ProcessItemReference'">
        <xsl:text>xml-field</xsl:text>
      </xsl:if>
      <xsl:if test="@ItemType='Activity'">
        <xsl:text>process-activities</xsl:text>
      </xsl:if>
    </xsl:attribute>
  </xsl:template>

  <xsl:template match="Item[@ItemType='ProcessSet']">
    <xsl:apply-templates select="Items/Item"/>
  </xsl:template>

  <xsl:template name="WINodeAttributes">
    <xsl:call-template name="AddWIIcon">
    </xsl:call-template>
    <xsl:attribute name="ItemType">
      <xsl:value-of select="@ItemType"/>
    </xsl:attribute>
    <xsl:if test="@ItemType='ProcessItemReference'">
      <xsl:attribute name="Accept">
        <xsl:text>.smartobject</xsl:text> <!-- This is the class name of the draggable object that should be allowed to be dropped in this target -->
      </xsl:attribute>
    </xsl:if>
    <xsl:if test="Name='SerialNumber' or Name='ActionName'">
      <xsl:attribute name="Required">
        <xsl:text>true</xsl:text>
      </xsl:attribute>
    </xsl:if>
    <xsl:call-template name="ActionPropertyCollection"/>
    <xsl:element name="DisplayName">
      <xsl:value-of select="DisplayName"/>
    </xsl:element>
    <xsl:element name="Name">
      <xsl:value-of select="Name"/>
    </xsl:element>
    <xsl:element name="Value">
      <xsl:choose>
        <xsl:when test="@ItemType='Activity'">
          <xsl:variable name="last-index">
            <xsl:call-template name="last-index-of">
              <xsl:with-param name="txt" select="Name"/>
              <xsl:with-param name="delimiter" select="'\'"/>
            </xsl:call-template>
          </xsl:variable>
          <xsl:value-of select="concat(substring(Name, 1, $last-index), DisplayName)"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="Name"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:element>
  </xsl:template>

  <xsl:template match="Item[ @ItemType='ProcessFolder' or @ItemType='Process' or @ItemType = 'ProcessFolio' or @ItemType = 'ProcessProperty' or @ItemType = 'ActivityProperty' or @ItemType='Activity' or @ItemType='Result' or @ItemType='ProcessInstance']">
    <xsl:element name="Item">
      <xsl:call-template name="WINodeAttributes">
      </xsl:call-template>
      <xsl:if test="Items/Item">
        <xsl:element name="Items" >
          <xsl:apply-templates select="Items/Item[@ItemType!='ProcessDataField' and @ItemType!='ProcessXmlField' and @ItemType!='ActivityDataField' and @ItemType!='ActivityXmlField']"/>
          <xsl:apply-templates mode="ProcessDataField" select="Items[Item[@ItemType='ProcessDataField']]"/>
          <xsl:apply-templates mode="ActivityDataField" select="Items[Item[@ItemType='ActivityDataField']]"/>
          <xsl:apply-templates mode="ProcessXmlField" select="Items[Item[@ItemType='ProcessXmlField']]"/>
          <xsl:apply-templates mode="ProcessItemReferences" select="Items[Item[@ItemType='ProcessItemReference']]"/>
          <xsl:apply-templates mode="ActivityXmlField" select="Items[Item[@ItemType='ActivityXmlField']]"/>
        </xsl:element>
      </xsl:if>
    </xsl:element>
  </xsl:template>

  <xsl:template mode="ProcessDataField" match="Items[Item[@ItemType='ProcessDataField']]">
    <xsl:element name="Item" >
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>data-fields</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="Grouping">
        <xsl:text>ProcessDataFields</xsl:text>
      </xsl:attribute>
      <xsl:element name="DisplayName">
        <xsl:text>Data Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Name">
        <xsl:text>Data Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Value">
        <xsl:text>Data Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Items">
        <xsl:for-each select="Item[@ItemType='ProcessDataField']">
          <xsl:element name="Item">
            <xsl:call-template name="WINodeAttributes">
            </xsl:call-template>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>
  <xsl:template mode="ProcessXmlField" match="Items[Item[@ItemType='ProcessXmlField']]">
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>xml-fields</xsl:text>
      </xsl:attribute>
      <xsl:element name="DisplayName">
        <xsl:text>Xml Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Name">
        <xsl:text>Xml Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Value">
        <xsl:text>Xml Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Items">
        <xsl:for-each select="Item[@ItemType='ProcessXmlField']">
          <xsl:element name="Item">
            <xsl:attribute name="ItemType">
              <xsl:text>ItemReference</xsl:text>
            </xsl:attribute>
            <xsl:call-template name="WINodeAttributes">
            </xsl:call-template>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>
  <xsl:template mode="ProcessItemReferences" match="Items[Item[@ItemType='ProcessItemReference']]">
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>xml-reference</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="Grouping">
        <xsl:text>ProcessItemReferences</xsl:text>
      </xsl:attribute>
      <xsl:element name="DisplayName">
        <xsl:text>Item References</xsl:text>
      </xsl:element>
      <xsl:element name="Name">
        <xsl:text>ItemReferences</xsl:text>
      </xsl:element>
      <xsl:element name="Value">
        <xsl:text>ItemReferences</xsl:text>
      </xsl:element>
      <xsl:element name="Items">
        <xsl:for-each select="Item[@ItemType='ProcessItemReference']">
          <xsl:element name="Item">
            <xsl:call-template name="WINodeAttributes">
            </xsl:call-template>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>
  <xsl:template mode="ActivityDataField" match="Items[Item[@ItemType='ActivityDataField']]">
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>data-fields</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="Grouping">
        <xsl:text>ActivityDataFields</xsl:text>
      </xsl:attribute>
      <xsl:element name="DisplayName">
        <xsl:text>Data Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Name">
        <xsl:text>Data Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Value">
        <xsl:text>Data Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Items">
        <xsl:for-each select="Item[@ItemType='ActivityDataField']">
          <xsl:element name="Item">
            <xsl:call-template name="WINodeAttributes">
            </xsl:call-template>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>
  <xsl:template mode="ActivityXmlField"  match="Items[Item[@ItemType='ActivityXmlField']]">
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>xml-fields</xsl:text>
      </xsl:attribute>
      <xsl:element name="DisplayName">
        <xsl:text>Xml Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Name">
        <xsl:text>Xml Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Value">
        <xsl:text>Xml Fields</xsl:text>
      </xsl:element>
      <xsl:element name="Items">
        <xsl:for-each select="Item[@ItemType='ActivityXmlField']">
          <xsl:element name="Item">
            <xsl:call-template name="WINodeAttributes">
            </xsl:call-template>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- View Template -->
  <xsl:template match="Item[@ItemType='View']">
    <xsl:variable name="InstanceID" select="InstanceID"></xsl:variable>
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>view</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
      <xsl:element name="Items">
        <xsl:choose>
          <xsl:when test ="Items/Item">
            <xsl:call-template name="ViewParameters">
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:call-template>
            <xsl:if test="Items/Item[@ItemType='Control']">
              <xsl:element name="Item">
                <xsl:attribute name="Icon">
                  <xsl:text>controls</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="Grouping">
                  <xsl:text>Controls</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="InstanceID">
                  <xsl:value-of select="$InstanceID"/>
                </xsl:attribute>
                <xsl:element name="DisplayName">
                  <xsl:value-of select="$Controls"/>
                </xsl:element>
                <xsl:element name="Items">
                  <xsl:if test="Items/Item[@ItemType='Control' and Template='Header']">
                    <xsl:element name="Item">
                      <xsl:attribute name="Icon">
                        <xsl:text>controls</xsl:text>
                      </xsl:attribute>
                      <xsl:element name="DisplayName">
                        <xsl:value-of select="$Header"/>
                      </xsl:element>
                      <xsl:element name="Items">
                        <xsl:apply-templates select="Items/Item[@ItemType='Control' and Template='Header']">
                          <xsl:with-param name="InstanceID" select="$InstanceID" />
                        </xsl:apply-templates>
                      </xsl:element>
                    </xsl:element>
                  </xsl:if>
                  <xsl:if test="Items/Item[@ItemType='Control' and Template='Display']">
                    <xsl:element name="Item">
                      <xsl:attribute name="Icon">
                        <xsl:text>controls</xsl:text>
                      </xsl:attribute>
                      <xsl:element name="DisplayName">
                        <xsl:value-of select="$Display"/>
                      </xsl:element>
                      <xsl:element name="Items">
                        <xsl:apply-templates select="Items/Item[@ItemType='Control' and Template='Display']">
                          <xsl:with-param name="InstanceID" select="$InstanceID" />
                        </xsl:apply-templates>
                      </xsl:element>
                    </xsl:element>
                  </xsl:if>
                  <xsl:if test="Items/Item[@ItemType='Control' and Template='Edit']">
                    <xsl:element name="Item">
                      <xsl:attribute name="Icon">
                        <xsl:text>controls</xsl:text>
                      </xsl:attribute>
                      <xsl:element name="DisplayName">
                        <xsl:value-of select="$Edit"/>
                      </xsl:element>
                      <xsl:element name="Items">
                        <xsl:apply-templates select="Items/Item[@ItemType='Control'and Template='Edit']">
                          <xsl:with-param name="InstanceID" select="$InstanceID" />
                        </xsl:apply-templates>
                      </xsl:element>
                    </xsl:element>
                  </xsl:if>
                  <xsl:if test="Items/Item[@ItemType='Control' and Template='Footer']">
                    <xsl:element name="Item">
                      <xsl:attribute name="Icon">
                        <xsl:text>controls</xsl:text>
                      </xsl:attribute>
                      <xsl:element name="DisplayName">
                        <xsl:value-of select="$Footer"/>
                      </xsl:element>
                      <xsl:element name="Items">
                        <xsl:apply-templates select="Items/Item[@ItemType='Control' and Template='Footer']">
                          <xsl:with-param name="InstanceID" select="$InstanceID" />
                        </xsl:apply-templates>
                      </xsl:element>
                    </xsl:element>
                  </xsl:if>
                  <xsl:if test="Items/Item[@ItemType='Control' and not(Template)]">
                    <xsl:apply-templates select="Items/Item[@ItemType='Control' and not(Template)]">
                      <xsl:with-param name="InstanceID" select="$InstanceID" />
                    </xsl:apply-templates>
                  </xsl:if>
                </xsl:element>
              </xsl:element>
            </xsl:if>
            <xsl:apply-templates select="Items/Item[@ItemType='FieldContext']">
              <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:apply-templates>
            <xsl:apply-templates select="Items/Item[@ItemType='Object']">
              <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:apply-templates>
            <xsl:apply-templates select="Items/Item[@ItemType='ViewMethod']">
              <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:apply-templates>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="DisplayName">
              <xsl:text>No items to display</xsl:text>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!--Area Item template-->
  <xsl:template match="Item[@ItemType='Control' and @SubType='AreaItem']">
    <xsl:param name="InstanceID"></xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:text>areaItem</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="ViewID">
        <xsl:value-of select="@ViewID"/>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
      <xsl:element name="Items">
        <xsl:choose>
          <xsl:when test="Items/Item[@ItemType='ControlProperty']">
            <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty']" mode="category">
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:apply-templates>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="DisplayName">
              <xsl:text>No items to display</xsl:text>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- Object Template -->
  <xsl:template match="Item[@ItemType='Object' or @ItemType='FieldContext']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test ="@ItemType='Object'">
            <xsl:text>smartobjectFF</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>smartobject</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:attribute name="Accept">
        <xsl:text>.xml-field</xsl:text>
        <!-- This is the class name of the draggable object that should be allowed to be dropped in this target -->
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
      <xsl:element name="Items">
        <xsl:choose>
          <xsl:when test="Items/Item">
            <xsl:if test="Items/Item[@ItemType='ObjectProperty' or @ItemType = 'ViewField']">
              <xsl:apply-templates select="Items/Item[@ItemType='ObjectProperty' or @ItemType='ViewField']">
                <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                <xsl:with-param name="InstanceID" select="$InstanceID"/>
              </xsl:apply-templates>
            </xsl:if>
            <xsl:if test="Items/Item[@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
              <xsl:apply-templates select="Items/Item[@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
                <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                <xsl:with-param name="InstanceID" select="$InstanceID"/>
              </xsl:apply-templates>
            </xsl:if>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="DisplayName">
              <xsl:text>No items to display</xsl:text>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- View and Form Details Template -->
  <xsl:template match="Item[@ItemType='Control' or @ItemType='ViewField']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test="@ItemType='Control'">
            <xsl:value-of select="translate(@SubType,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"/>
            <xsl:text>-control</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'AutoGuid' or @SubType = 'autoguid'">
            <xsl:text>auto-guid</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'AutoNumber' or @SubType = 'autonumber'">
            <xsl:text>auto-number</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
            <xsl:text>date-time</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Date' or @SubType = 'date'">
            <xsl:text>date</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Time' or @SubType = 'time'">
            <xsl:text>time</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Decimal' or @SubType = 'decimal'">
            <xsl:text>decimal</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'File' or @SubType = 'file'">
            <xsl:text>file</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Guid' or @SubType = 'guid'">
            <xsl:text>guid</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'HyperLink' or @SubType = 'hyperlink' or @SubType = 'Hyperlink' or @SubType = 'hyperLink'">
            <xsl:text>hyperlink</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Image' or @SubType = 'image'">
            <xsl:text>image</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Memo' or @SubType = 'memo'">
            <xsl:text>memo</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
            <xsl:text>number</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'YesNo' or @SubType = 'yesno'">
            <xsl:text>yesno</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'MultiValue' or @SubType = 'multiValue' or @SubType = 'Multivalue'  or @SubType = 'multivalue'">
            <xsl:text>multi-value</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
            <xsl:text>text</xsl:text>
          </xsl:when>
          <xsl:when test="@ItemType='FieldContext'">
            <xsl:text>smartobject</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="translate(@SubType,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')"/>
            <xsl:text>-control</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
      <!--control properties and methods-->
      <xsl:choose>
        <xsl:when test="Items/Item[@ItemType='ControlMethod' and Items/Item[@ItemType='ControlMethodParameter']]">
          <xsl:variable name="ControlType">
            <xsl:value-of select="@SubType"/>
          </xsl:variable>
          <xsl:element name="Items">
            <xsl:apply-templates select="Items/Item[@ItemType='ControlMethod']">
              <xsl:with-param name="InstanceID" select="$InstanceID" />
              <xsl:with-param name="ControlType" select="$ControlType" />
            </xsl:apply-templates>
            <xsl:if test ="Items/Item[@ItemType='ControlProperty' or @ItemType='ControlField']">
              <xsl:element name="Item">
                <xsl:attribute name="Icon">
                  <xsl:text>control-method-properties</xsl:text>
                </xsl:attribute>
                <xsl:element name="DisplayName">
                  <xsl:value-of select="$ControlMethodProperties"/>
                </xsl:element>
                <xsl:element name="Items">
                  <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty']" mode="category">
                    <xsl:with-param name="InstanceID" select="$InstanceID" />
                  </xsl:apply-templates>
                  <xsl:apply-templates select="Items/Item[@ItemType='ControlField']" mode="category">
                    <xsl:with-param name="InstanceID" select="$InstanceID" />
                  </xsl:apply-templates>
                </xsl:element>
              </xsl:element>
            </xsl:if>
          </xsl:element>
        </xsl:when>
        <xsl:when test="Items/Item[@ItemType='ControlProperty' or @ItemType='ControlField']">
          <xsl:element name="Items">
            <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty']" mode="category">
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:apply-templates>
            <xsl:apply-templates select="Items/Item[@ItemType='ControlField']" mode="category">
              <xsl:with-param name="InstanceID" select="$InstanceID" />
            </xsl:apply-templates>
          </xsl:element>
        </xsl:when>
      </xsl:choose>
    </xsl:element>
  </xsl:template>

  <!-- Control Type Method Template -->
  <xsl:template  match="Item[@ItemType='ControlMethod']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:param name="ControlType"/>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:text>control-method</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes"/>
      <!--control method parameters-->
      <xsl:element name="Items">
        <xsl:if test="Items/Item[@ItemType='ControlMethodParameter']">
          <xsl:element name="Item">
            <xsl:attribute name="Icon">
              <xsl:text>control-method-parameters</xsl:text>
            </xsl:attribute>
            <xsl:element name="DisplayName">
              <xsl:value-of select="$ControlMethodParameters"/>
            </xsl:element>
            <xsl:element name="Items">
              <xsl:apply-templates select="Items/Item[@ItemType='ControlMethodParameter']">
                <xsl:with-param name="InstanceID" select="$InstanceID" />
              </xsl:apply-templates>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- Control Type Method Parameter Template -->
  <xsl:template  match="Item[@ItemType='ControlMethodParameter']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test="@SubType = 'Boolean' or @SubType = 'boolean'">
            <xsl:text>boolean</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'DateTime' or @SubType = 'Datetime'">
            <xsl:text>date-time</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
            <xsl:text>number</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>text</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:attribute name="TargetID">
        <xsl:value-of select="Name"/>
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>	
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:if test="IsRequired='True'">
        <xsl:attribute name="Required">
          <xsl:text>true</xsl:text>
        </xsl:attribute>
      </xsl:if>
      <xsl:call-template name="AddAttributes"/>
    </xsl:element>
  </xsl:template>

  <!-- Control Properties Category Template -->
  <xsl:template  match="Item[@ItemType='ControlProperty']" mode="category">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:text>ControlPropertyCategory</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes"/>
      <xsl:element name="Items">
        <xsl:apply-templates select="Items/Item[@ItemType='ControlProperty']">
          <xsl:with-param name="InstanceID" select="$InstanceID" />
        </xsl:apply-templates>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- Control Property Template -->
  <xsl:template  match="Item[@ItemType='ControlProperty']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:text>ControlProperty</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes"/>
    </xsl:element>
  </xsl:template>

  <!-- Control Fields Category Template -->
  <xsl:template  match="Item[@ItemType='ControlField']" mode="category">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:text>ControlPropertyCategory</xsl:text>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes"/>
      <xsl:element name="Items">
        <xsl:apply-templates select="Items/Item[@ItemType='ControlField']">
          <xsl:with-param name="InstanceID" select="$InstanceID" />
        </xsl:apply-templates>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- Control Field Template -->
  <xsl:template  match="Item[@ItemType='ControlField']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test="./@Icon">
            <xsl:value-of select="./@Icon"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>ControlProperty</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name ="ViewParameters">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:if test="Items/Item[@ItemType='ViewParameter']">
      <xsl:element name="Item">
        <xsl:attribute name="Icon">
          <xsl:text>parameters</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Grouping">
          <xsl:text>ViewParameters</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="InstanceID">
          <xsl:value-of select="$InstanceID"/>
        </xsl:attribute>
        <xsl:element name="DisplayName">
          <xsl:value-of select="$Parameters"/>
        </xsl:element>
        <xsl:element name="Items">
          <xsl:apply-templates select="Items/Item[@ItemType='ViewParameter']">
            <xsl:with-param name="InstanceID" select="$InstanceID" />
          </xsl:apply-templates>
        </xsl:element>
      </xsl:element>

    </xsl:if>
  </xsl:template>

  <!-- ViewParameter Template -->
  <xsl:template  match="Item[@ItemType='ViewParameter']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Name">
        <xsl:value-of select ="Name"/>
      </xsl:attribute>
      <xsl:attribute name="id">
        <xsl:value-of select ="Name"/>
      </xsl:attribute>
      <xsl:attribute name="text">
        <xsl:value-of select ="DisplayName"/>
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
            <xsl:text>date-time</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
            <xsl:text>number</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Boolean' or @SubType = 'yesno'">
            <xsl:text>yesno</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
            <xsl:text>text</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>text</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="@disabled">
          <xsl:text> disabled</xsl:text>
        </xsl:if>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
    </xsl:element>
  </xsl:template>

  <!-- Form Parameter Template -->
  <xsl:template  match="Item[@ItemType='FormParameter']">
    <xsl:element name="Item">
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test="@SubType = 'AutoGuid' or @SubType = 'Autoguid'">
            <xsl:text>auto-guid</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'AutoNumber' or @SubType = 'Autonumber'">
            <xsl:text>auto-number</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'DateTime' or @SubType = 'Datetime'">
            <xsl:text>date-time</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Decimal' or @SubType = 'decimal'">
            <xsl:text>decimal</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'File' or @SubType = 'File'">
            <xsl:text>file</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Guid' or @SubType = 'guid'">
            <xsl:text>guid</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Boolean' or @SubType = 'boolean'">
            <xsl:text>yesno</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
            <xsl:text>number</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>text</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
    </xsl:element>
  </xsl:template>

  <!-- Object Property Template -->
  <xsl:template  match="Item[@ItemType='ObjectProperty' or @ItemType= 'MethodRequiredProperty' or @ItemType= 'MethodOptionalProperty' or @ItemType= 'MethodReturnedProperty' or @ItemType= 'MethodParameter']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:choose>
        <xsl:when test="not($SubFormID)=false and $InstanceID!='00000000-0000-0000-0000-000000000000'">
          <xsl:attribute name="SubFormInstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="InstanceID">
            <xsl:value-of select="$InstanceID"/>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="SubFormID">
        <xsl:value-of select="$SubFormID"/>
      </xsl:attribute>
      <xsl:attribute name="Icon">
        <xsl:choose>
          <xsl:when test="@SubType = 'AutoGuid' or @SubType = 'autoguid'">
            <xsl:text>auto-guidFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'AutoNumber' or @SubType = 'autonumber' or @SubType = 'Autonumber'">
            <xsl:text>auto-numberFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'DateTime' or @SubType = 'datetime'">
            <xsl:text>date-timeFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Date' or @SubType = 'date'">
            <xsl:text>dateFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Time' or @SubType = 'time'">
            <xsl:text>timeFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Decimal' or @SubType = 'decimal'">
            <xsl:text>decimalFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'File' or @SubType = 'file'">
            <xsl:text>fileFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Guid' or @SubType = 'guid'">
            <xsl:text>guidFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'HyperLink' or @SubType = 'hyperlink' or @SubType = 'Hyperlink' or @SubType = 'hyperLink'">
            <xsl:text>hyperlinkFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Image' or @SubType = 'image'">
            <xsl:text>imageFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Memo' or @SubType = 'memo'">
            <xsl:text>memoFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Number' or @SubType = 'number'">
            <xsl:text>numberFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'YesNo' or @SubType = 'yesno'">
            <xsl:text>yesnoFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'MultiValue' or @SubType = 'multiValue' or @SubType = 'Multivalue'  or @SubType = 'multivalue'">
            <xsl:text>multi-valueFF</xsl:text>
          </xsl:when>
          <xsl:when test="@SubType = 'Text' or @SubType = 'text'">
            <xsl:text>textFF</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>textFF</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:if test="Item[@ItemType='MethodRequiredProperty']">
        <xsl:attribute name="IsRequired">
          <xsl:text>True</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="Required">
          <xsl:text>True</xsl:text>
        </xsl:attribute>
      </xsl:if>
      <xsl:if test="@ItemType='MethodParameter' and not(IsRequired/text()='false')">
        <xsl:attribute name="Required">
          <xsl:text>true</xsl:text>
        </xsl:attribute>
      </xsl:if>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
    </xsl:element>
  </xsl:template>

  <!-- Object Method Template -->
  <xsl:template  match="Item[@ItemType='ObjectMethod' or @ItemType = 'Method' or @ItemType = 'ViewMethod']">
    <xsl:param name="InstanceID">00000000-0000-0000-0000-000000000000</xsl:param>
    <xsl:element name="Item">
      <xsl:attribute name="Icon">
        <xsl:text>smartobject-method</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="InstanceID">
        <xsl:value-of select="$InstanceID"/>
      </xsl:attribute>
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
      <xsl:element name="Items">
        <xsl:if test="Items/Item[@ItemType='MethodParameter']">
          <xsl:element name="Item">
            <xsl:element name="DisplayName">
              <xsl:value-of select="$Parameters"/>
            </xsl:element>
            <xsl:element name="Items">
              <xsl:apply-templates select="Items/Item[@ItemType='MethodParameter']">
                <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                <xsl:with-param name="InstanceID" select="$InstanceID"></xsl:with-param>
              </xsl:apply-templates>
            </xsl:element>
          </xsl:element>
        </xsl:if>
        <xsl:if test="Items/Item[@ItemType = 'MethodRequiredProperty' or @ItemType = 'MethodOptionalProperty']">
          <xsl:element name="Item">
            <xsl:attribute name="InstanceID">
              <xsl:value-of select="$InstanceID"/>
            </xsl:attribute>
            <xsl:attribute name="Grouping">
              <xsl:text>InputProperties</xsl:text>
            </xsl:attribute>
            <xsl:element name="DisplayName">
              <xsl:value-of select="$InputProperties"/>
            </xsl:element>
            <xsl:element name="Items">
              <xsl:apply-templates select="Items/Item[@ItemType='MethodRequiredProperty']">
                <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                <xsl:with-param name="InstanceID" select="$InstanceID"></xsl:with-param>
              </xsl:apply-templates>
              <xsl:apply-templates select="Items/Item[@ItemType='MethodOptionalProperty']">
                <!--<xsl:sort data-type="text" select="DisplayName" order="ascending"/>-->
                <xsl:with-param name="InstanceID" select="$InstanceID"></xsl:with-param>
              </xsl:apply-templates>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </xsl:element>
    </xsl:element>
  </xsl:template>
  <xsl:template match="Item[@ItemType='Setting']">
    <xsl:element name="Item">
      <xsl:call-template name="AddAttributes">
      </xsl:call-template>
    </xsl:element>
  </xsl:template>

  <xsl:template name="AddAttributes">
    <xsl:for-each select="./@*">
      <xsl:variable name="nodeName">
        <xsl:value-of select="local-name()"/>
      </xsl:variable>
      <xsl:attribute name="{$nodeName}">
        <xsl:value-of select="."/>
      </xsl:attribute>
    </xsl:for-each>
    <xsl:call-template name="ActionPropertyCollection"/>
    <xsl:for-each select="./*">
      <xsl:if test="local-name() != 'Items'">
        <xsl:variable name="nodeName">
          <xsl:value-of select="local-name()"/>
        </xsl:variable>
        <xsl:element name="{$nodeName}">
          <xsl:value-of select="."/>
        </xsl:element>
      </xsl:if>
    </xsl:for-each>
  </xsl:template>

  <xsl:template match="Collections" mode="Collections">
    <xsl:param name="Identifier"/>
    <xsl:choose>
      <xsl:when test="Collection[IncludeFilters/IncludeFilter[@RuleIdentifier=$Identifier]]">
        <xsl:value-of select="Collection[(IncludeFilters/IncludeFilter[@RuleIdentifier=$Identifier])]/@Type"/>
      </xsl:when>
      <xsl:when test="Collection[not(ExcludeFilters/ExcludeFilter[@RuleIdentifier=$Identifier])]">
        <xsl:value-of select="Collection[not(ExcludeFilters/ExcludeFilter[@RuleIdentifier=$Identifier])]/@Type"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="Collection[not(IncludeFilters)][1]/@Type"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="ActionPropertyCollection">
    <xsl:param name="Identifier">
      <xsl:choose>
        <xsl:when test="./@Guid">
          <xsl:value-of select="./@Guid"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="./Name"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:param>
    <xsl:attribute name="ActionPropertyCollection">
      <xsl:choose>
        <xsl:when test="string-length($ResultName) > 0">
          <xsl:choose>
            <xsl:when test="function-available('exslt:node-set')">
              <xsl:apply-templates select="exslt:node-set(/Item/Collections[@ResultName = $ResultName])" mode="Collections">
                <xsl:with-param name="Identifier" select="$Identifier" />
              </xsl:apply-templates>
            </xsl:when>
            <xsl:when test="function-available('msxsl:node-set')">
              <xsl:apply-templates select="msxsl:node-set(/Item/Collections[@ResultName = $ResultName])" mode="Collections">
                <xsl:with-param name="Identifier" select="$Identifier" />
              </xsl:apply-templates>
            </xsl:when>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="function-available('exslt:node-set')">
              <xsl:apply-templates select="exslt:node-set(/Item/Collections)" mode="Collections">
                <xsl:with-param name="Identifier" select="$Identifier" />
              </xsl:apply-templates>
            </xsl:when>
            <xsl:when test="function-available('msxsl:node-set')">
              <xsl:apply-templates select="msxsl:node-set(/Item/Collections)" mode="Collections">
                <xsl:with-param name="Identifier" select="$Identifier" />
              </xsl:apply-templates>
            </xsl:when>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
  </xsl:template>

  <!-- helper templates-->
  <xsl:template name="last-index-of">
    <xsl:param name="txt"/>
    <xsl:param name="remainder" select="$txt"/>
    <xsl:param name="delimiter"/>

    <xsl:choose>
      <xsl:when test="contains($remainder, $delimiter)">
        <xsl:call-template name="last-index-of">
          <xsl:with-param name="txt" select="$txt"/>
          <xsl:with-param name="remainder" select="substring-after($remainder, $delimiter)"/>
          <xsl:with-param name="delimiter" select="$delimiter"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:variable name="lastIndex" select="string-length(substring($txt, 1, string-length($txt)-string-length($remainder)))+1"/>
        <xsl:choose>
          <xsl:when test="string-length($remainder)=0">
            <xsl:value-of select="string-length($txt)"/>
          </xsl:when>
          <xsl:when test="$lastIndex>0">
            <xsl:value-of select="($lastIndex - string-length($delimiter))"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="0"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:transform>
