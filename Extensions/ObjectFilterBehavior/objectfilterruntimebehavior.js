/**
 * @memberof gdjs
 * @class tween
 * @static
 * @private
 */

gdjs.ObjectFilterRuntimeBehavior = function (runtimeScene, behaviorData, owner) {
  gdjs.RuntimeBehavior.call(this, runtimeScene, behaviorData, owner);
  this._filterTypes = {
    "BlurFilter": PIXI.filters.BlurFilter,
    "NoiseFilter": PIXI.filters.NoiseFilter
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
 * @param {number} resolution The resolution of the blur to apply
 * @param {number} quality The quality of blur to apply
 * @param {number} kernelSize The kernel size of blur to apply
 */
gdjs.ObjectFilterRuntimeBehavior.prototype.setBlurFilter = function (strength, resolution, quality, kernelSize) {
  if (!PIXI) return;
  const renderObject = this.owner.getRendererObject();
  if (typeof renderObject.filters === 'undefined') return;

  renderObject.filters = [new PIXI.filters.BlurFilter(strength, resolution, quality, kernelSize)];
  // TODO: Find a way to add multiple filters (array.push doesn't work)
};

/**
 * Set a noise filter on the object.
 * @param {number} intensity The intensity of the noise (value between 0 and 1)
 */
gdjs.ObjectFilterRuntimeBehavior.prototype.setNoiseFilter = function (intensity) {
  if (!PIXI) return;
  const renderObject = this.owner.getRendererObject();
  if (typeof renderObject.filters === 'undefined') return;

  renderObject.filters = [new PIXI.filters.NoiseFilter(intensity)];
  // TODO: Find a way to add multiple filters (array.push doesn't work)
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
      return;
    };
  }
};

gdjs.ObjectFilterRuntimeBehavior.prototype.doStepPreEvents = function (runtimeScene) {};

gdjs.ObjectFilterRuntimeBehavior.prototype.onDeActivate = function () {};