/**
 * This is a declaration of an extension for GDevelop 5.
 *
 * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change
 * to this extension file or to any other *.js file that you reference inside.
 *
 * The file must be named "JsExtension.js", otherwise GDevelop won't load it.
 * ⚠️ If you make a change and the extension is not loaded, open the developer console
 * and search for any errors.
 *
 * More information on https://github.com/4ian/GDevelop/blob/master/newIDE/README-extensions.md
 */
module.exports = {
  createExtension: function (_, gd) {
    const extension = new gd.PlatformExtension();
    extension
      .setExtensionInformation(
        "ObjectFilter",
        _("Object filters"),
        _("Object based shader filters."),
        "Matthias Meike",
        "Open source (MIT License)"
      )
      .setExtensionHelpPath("/all-features/objectfilter");

    var objectFilterBehavior = new gd.BehaviorJsImplementation();

    objectFilterBehavior.updateProperty = function (
      behaviorContent,
      propertyName,
      newValue
    ) {
      return false;
    };

    objectFilterBehavior.getProperties = function (behaviorContent) {
      var behaviorProperties = new gd.MapStringPropertyDescriptor();
      return behaviorProperties;
    };

    objectFilterBehavior.setRawJSONContent(
      JSON.stringify({})
    );

    const behavior = extension
      .addBehavior(
        "ObjectFilterBehavior",
        _("Object filters"),
        "ObjectFilterBehavior",
        _("Object filters"),
        "",
        "CppPlatform/Extensions/topdownmovementicon.png",
        "ObjectFilterBehavior",
        objectFilterBehavior,
        new gd.BehaviorsSharedData()
      )
      .setIncludeFile("Extensions/ObjectFilterBehavior/objectfilterruntimebehavior.js")
      .addIncludeFile("Extensions/ObjectFilterBehavior/pixi-filters.js");

    // Behavior related
    behavior
      .addAction(
        "SetBlurFilter",
        _("Set blur filter on object"),
        _("Set a blur filter to the object."),
        _(
          "Set blur filter on object _PARAM0_ with amount _PARAM2_"
        ),
        _("Blur filter"),
        "JsPlatform/Extensions/take_screenshot24.png",
        "JsPlatform/Extensions/take_screenshot32.png"
      )
      .addParameter("object", _("Object"), "", false)
      .addParameter("behavior", _("Behavior"), "ObjectFilterBehavior", false)
      .addParameter("expression", _("Amount"), "", false)
      .getCodeExtraInformation()
      .setFunctionName("setBlurFilter");

      behavior
      .addAction(
        "RemoveBlurFilter",
        _("Remove blur filter from object"),
        _("Remove the blur filter from the object."),
        _(
          "Remove Blur filter from object _PARAM0_"
        ),
        _("Blur filter"),
        "JsPlatform/Extensions/take_screenshot24.png",
        "JsPlatform/Extensions/take_screenshot32.png"
      )
      .addParameter("object", _("Object"), "", false)
      .addParameter("behavior", _("Behavior"), "ObjectFilterBehavior", false)
      .getCodeExtraInformation()
      .setFunctionName("removeBlurFilter");

    return extension;
  },

  runExtensionSanityTests: function (gd, extension) {
    return [];
  }
};
