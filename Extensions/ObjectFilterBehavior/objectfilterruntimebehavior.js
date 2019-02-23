/**
 * @memberof gdjs
 * @class tween
 * @static
 * @private
 */

gdjs.ObjectFilterRuntimeBehavior = function(runtimeScene, behaviorData, owner) {
  gdjs.RuntimeBehavior.call(this, runtimeScene, behaviorData, owner);
};

gdjs.ObjectFilterRuntimeBehavior.prototype = Object.create(
  gdjs.RuntimeBehavior.prototype
);

gdjs.ObjectFilterRuntimeBehavior.thisIsARuntimeBehaviorConstructor =
  "ObjectFilter::ObjectFilterBehavior";

/**
 * Set a blur filter on the object.
 * @param {number} amount The amount of blur to apply
 */
gdjs.ObjectFilterRuntimeBehavior.prototype.setBlurFilter = function(amount) {
  if (!PIXI) return;
  this.owner.getRendererObject().filters = [new PIXI.filters.BlurFilter(amount)];
};

/**
 * Remove the blur filter from the object.
 */
gdjs.ObjectFilterRuntimeBehavior.prototype.removeBlurFilter = function() {
  if (!PIXI) return;
  const renderObject = this.owner.getRendererObject();
  if (!renderObject.filters) return;
  
  for (var index = 0; index < renderObject.filters.length; index++){
    if (renderObject.filters[index] instanceof PIXI.filters.BlurFilter){
      renderObject.filters[index].enabled = false;
    };
  }
};

gdjs.ObjectFilterRuntimeBehavior.prototype.doStepPreEvents = function(runtimeScene) {};

gdjs.ObjectFilterRuntimeBehavior.prototype.onDeActivate = function() {};
