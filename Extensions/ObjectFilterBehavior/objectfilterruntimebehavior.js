/**
 * @memberof gdjs
 * @class tween
 * @static
 * @private
 */

gdjs.ObjectFilterRuntimeBehavior = function (runtimeScene, behaviorData, owner) {
  gdjs.RuntimeBehavior.call(this, runtimeScene, behaviorData, owner);
  this._filterTypes = {
    "BlurFilter": PIXI.filters.BlurFilter
  };
};

gdjs.ObjectFilterRuntimeBehavior.prototype = Object.create(
  gdjs.RuntimeBehavior.prototype
);

gdjs.ObjectFilterRuntimeBehavior.thisIsARuntimeBehaviorConstructor =
  "ObjectFilter::ObjectFilterBehavior";

/**
 * Set a blur filter on the object.
 * @param {number} strength The strength of blur to apply
 */
gdjs.ObjectFilterRuntimeBehavior.prototype.setBlurFilter = function (strength, resolution, quality, kernelSize) {
  if (!PIXI) return;
  if (typeof this.owner.getRendererObject().filters === 'undefined') return;

  this.owner.getRendererObject().filters = [new PIXI.filters.BlurFilter(strength, resolution, quality, kernelSize)];
};

/**
 * Remove the blur filter from the object.
 */
gdjs.ObjectFilterRuntimeBehavior.prototype.removeFilter = function (filterType) {
  if (!PIXI) return;
  if (!filterType in this._filterTypes) return;
  const renderObject = this.owner.getRendererObject();
  if (typeof renderObject.filters === 'undefined') return;

  for (var index = 0; index < renderObject.filters.length; index++) {
    if (renderObject.filters[index] instanceof this._filterTypes[filterType]) {
      renderObject.filters[index].enabled = false;
    };
  }
};

gdjs.ObjectFilterRuntimeBehavior.prototype.doStepPreEvents = function (runtimeScene) {};

gdjs.ObjectFilterRuntimeBehavior.prototype.onDeActivate = function () {};