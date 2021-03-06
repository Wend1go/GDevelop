import React, { Component } from 'react';
import gesture from 'pixi-simple-gesture';
import KeyboardShortcuts from '../UI/KeyboardShortcuts';
import InstancesRenderer from './InstancesRenderer';
import ViewPosition from './ViewPosition';
import SelectedInstances from './SelectedInstances';
import HighlightedInstance from './HighlightedInstance';
import SelectionRectangle from './SelectionRectangle';
import InstancesResizer from './InstancesResizer';
import InstancesRotator from './InstancesRotator';
import InstancesMover from './InstancesMover';
import Grid from './Grid';
import WindowBorder from './WindowBorder';
import WindowMask from './WindowMask';
import BackgroundColor from './BackgroundColor';
import * as PIXI from 'pixi.js';
import FpsLimiter from './FpsLimiter';
import { startPIXITicker, stopPIXITicker } from '../Utils/PIXITicker';
import StatusBar from './StatusBar';
import CanvasCursor from './CanvasCursor';
import InstancesAdder from './InstancesAdder';
import { makeDropTarget } from '../UI/DragAndDrop/DropTarget';
import { objectWithContextReactDndType } from '../ObjectsList';
import PinchHandler, { shouldBeHandledByPinch } from './PinchHandler';

const styles = {
  canvasArea: { flex: 1, position: 'absolute', overflow: 'hidden' },
  dropCursor: { cursor: 'copy' },
};

const DropTarget = makeDropTarget(objectWithContextReactDndType);

export default class InstancesEditorContainer extends Component {
  lastContextMenuX = 0;
  lastContextMenuY = 0;
  lastCursorX = 0;
  lastCursorY = 0;
  fpsLimiter = new FpsLimiter(28);

  componentDidMount() {
    // Initialize the PIXI renderer, if possible
    if (this.canvasArea && !this.pixiRenderer) {
      this._initializeCanvasAndRenderer();
    }
  }

  componentDidUpdate() {
    // Initialize the PIXI renderer, if not already done.
    // This can happen if canvasArea was not rendered
    // just after the mount (depends on react-dnd versions?).
    if (this.canvasArea && !this.pixiRenderer) {
      this._initializeCanvasAndRenderer();
    }
  }

  _initializeCanvasAndRenderer() {
    // project can be used here for initializing stuff, but don't keep references to it.
    // Instead, create editors in _mountEditorComponents (as they will be destroyed/recreated
    // if the project changes).
    const { project } = this.props;

    this.pixiRenderer = PIXI.autoDetectRenderer(
      this.props.width,
      this.props.height,
      { antialias: true } //fixes jaggy edges
    );
    this.canvasArea.appendChild(this.pixiRenderer.view);
    this.pixiRenderer.view.addEventListener('contextmenu', e => {
      e.preventDefault();

      this.lastContextMenuX = e.offsetX;
      this.lastContextMenuY = e.offsetY;
      if (this.props.onContextMenu)
        this.props.onContextMenu(e.clientX, e.clientY);

      return false;
    });
    this.pixiRenderer.view.onmousewheel = event => {
      if (this.keyboardShortcuts.shouldZoom()) {
        this.zoomBy(event.wheelDelta / 5000);
      } else if (this.keyboardShortcuts.shouldScrollHorizontally()) {
        this.viewPosition.scrollBy(-event.wheelDelta / 10, 0);
      } else {
        this.viewPosition.scrollBy(event.deltaX / 10, event.deltaY / 10);
      }

      if (this.props.onViewPositionChanged) {
        this.props.onViewPositionChanged(this.viewPosition);
      }
      event.preventDefault();
    };
    this.pixiRenderer.view.setAttribute('tabIndex', -1);
    this.pixiRenderer.view.addEventListener('focus', e => {
      this.keyboardShortcuts.focus();
    });
    this.pixiRenderer.view.addEventListener('blur', e => {
      this.keyboardShortcuts.blur();
    });
    this.pixiRenderer.view.addEventListener('mouseover', e => {
      this.keyboardShortcuts.focus();
    });
    this.pixiRenderer.view.addEventListener('mouseout', e => {
      this.keyboardShortcuts.blur();
    });

    this.pixiContainer = new PIXI.Container();

    this.backgroundArea = new PIXI.Container();
    this.backgroundArea.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.props.width,
      this.props.height
    );
    gesture.panable(this.backgroundArea);
    this.backgroundArea.on('mousedown', event =>
      this._onBackgroundClicked(event.data.global.x, event.data.global.y)
    );
    this.backgroundArea.on('touchstart', event => {
      if (shouldBeHandledByPinch(event.data && event.data.originalEvent)) {
        return;
      }

      this._onBackgroundClicked(event.data.global.x, event.data.global.y);
    });
    this.backgroundArea.on('mousemove', event =>
      this._onMouseMove(event.data.global.x, event.data.global.y)
    );
    this.backgroundArea.on('panmove', event =>
      this._onPanMove(
        event.deltaX,
        event.deltaY,
        event.data.global.x,
        event.data.global.y
      )
    );
    this.backgroundArea.on('panend', event => this._onPanEnd());
    this.pixiContainer.addChild(this.backgroundArea);

    this.viewPosition = new ViewPosition({
      initialViewX: project ? project.getMainWindowDefaultWidth() / 2 : 0,
      initialViewY: project ? project.getMainWindowDefaultHeight() / 2 : 0,
      width: this.props.width,
      height: this.props.height,
      options: this.props.options,
    });
    this.pixiContainer.addChild(this.viewPosition.getPixiContainer());

    this.grid = new Grid({
      viewPosition: this.viewPosition,
      options: this.props.options,
    });
    this.pixiContainer.addChild(this.grid.getPixiObject());

    this.keyboardShortcuts = new KeyboardShortcuts({
      onDelete: this.props.onDeleteSelection,
      onMove: this.moveSelection,
      onCopy: this.props.onCopy,
      onCut: this.props.onCut,
      onPaste: this.props.onPaste,
      onUndo: this.props.onUndo,
      onRedo: this.props.onRedo,
      onZoomOut: this.props.onZoomOut,
      onZoomIn: this.props.onZoomIn,
    });

    this.pinchHandler = new PinchHandler({
      canvas: this.pixiRenderer.view,
      setZoomFactor: this.setZoomFactor,
      getZoomFactor: this.getZoomFactor,
      viewPosition: this.viewPosition,
    });

    this.canvasCursor = new CanvasCursor({
      canvas: this.canvasArea,
      shouldMoveView: () => this.keyboardShortcuts.shouldMoveView(),
    });

    this._instancesAdder = new InstancesAdder({
      instances: this.props.initialInstances,
      options: this.props.options,
    });

    this._mountEditorComponents(this.props);
    this._renderScene();
  }

  /**
   * Force the internal InstancesRenderer to be destroyed and recreated
   * (as well as other components holding references to instances). Call
   * this when the initial instances were recreated to ensure that there
   * is not mismatch between renderers and the instances that were updated.
   */
  forceRemount() {
    this._mountEditorComponents(this.props);
  }

  _mountEditorComponents(props) {
    //Remove and delete any existing editor component
    if (this.highlightedInstance) {
      this.pixiContainer.removeChild(this.highlightedInstance.getPixiObject());
    }
    if (this.selectedInstances) {
      this.pixiContainer.removeChild(this.selectedInstances.getPixiContainer());
    }
    if (this.instancesRenderer) {
      this.viewPosition
        .getPixiContainer()
        .removeChild(this.instancesRenderer.getPixiContainer());
      this.instancesRenderer.delete();
    }
    if (this.selectionRectangle) {
      this.pixiContainer.removeChild(this.selectionRectangle.getPixiObject());
      this.selectionRectangle.delete();
    }
    if (this.windowBorder) {
      this.pixiContainer.removeChild(this.windowBorder.getPixiObject());
    }
    if (this.windowMask) {
      this.pixiContainer.removeChild(this.windowMask.getPixiObject());
    }
    if (this.statusBar) {
      this.pixiContainer.removeChild(this.statusBar.getPixiObject());
    }

    this.backgroundColor = new BackgroundColor({
      layout: props.layout,
      pixiRenderer: this.pixiRenderer,
    });
    this.instancesRenderer = new InstancesRenderer({
      project: props.project,
      layout: props.layout,
      instances: props.initialInstances,
      viewPosition: this.viewPosition,
      onOverInstance: this._onOverInstance,
      onMoveInstance: this._onMoveInstance,
      onMoveInstanceEnd: this._onMoveInstanceEnd,
      onDownInstance: this._onDownInstance,
      onOutInstance: this._onOutInstance,
      onInstanceClicked: this._onInstanceClicked,
    });
    this.selectionRectangle = new SelectionRectangle({
      instances: props.initialInstances,
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      toSceneCoordinates: this.viewPosition.toSceneCoordinates,
    });
    this.selectedInstances = new SelectedInstances({
      instancesSelection: this.props.instancesSelection,
      onResize: this._onResize,
      onResizeEnd: this._onResizeEnd,
      onRotate: this._onRotate,
      onRotateEnd: this._onRotateEnd,
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      toCanvasCoordinates: this.viewPosition.toCanvasCoordinates,
      screenType: this.props.screenType,
    });
    this.highlightedInstance = new HighlightedInstance({
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      toCanvasCoordinates: this.viewPosition.toCanvasCoordinates,
    });
    this.instancesResizer = new InstancesResizer({
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      options: this.props.options,
    });
    this.instancesRotator = new InstancesRotator();
    this.instancesMover = new InstancesMover({
      instanceMeasurer: this.instancesRenderer.getInstanceMeasurer(),
      options: this.props.options,
    });
    this.windowBorder = new WindowBorder({
      project: props.project,
      layout: props.layout,
      toCanvasCoordinates: this.viewPosition.toCanvasCoordinates,
    });
    this.windowMask = new WindowMask({
      project: props.project,
      viewPosition: this.viewPosition,
      options: this.props.options,
    });
    this.statusBar = new StatusBar({
      width: this.props.width,
      height: this.props.height,
      getLastCursorSceneCoordinates: this.getLastCursorSceneCoordinates,
    });

    this.pixiContainer.addChild(this.selectionRectangle.getPixiObject());
    this.viewPosition
      .getPixiContainer()
      .addChild(this.instancesRenderer.getPixiContainer());
    this.pixiContainer.addChild(this.windowBorder.getPixiObject());
    this.pixiContainer.addChild(this.windowMask.getPixiObject());
    this.pixiContainer.addChild(this.selectedInstances.getPixiContainer());
    this.pixiContainer.addChild(this.highlightedInstance.getPixiObject());
    this.pixiContainer.addChild(this.statusBar.getPixiObject());
  }

  componentWillUnmount() {
    // This is an antipattern and is theorically not needed, but help
    // to protect against renders after the component is unmounted.
    this._unmounted = true;

    this.keyboardShortcuts.unmount();
    this.selectionRectangle.delete();
    this.instancesRenderer.delete();
    this._instancesAdder.unmount();
    this.pinchHandler.unmount();
    if (this.nextFrame) cancelAnimationFrame(this.nextFrame);
    stopPIXITicker();
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.width !== this.props.width ||
      nextProps.height !== this.props.height
    ) {
      this.pixiRenderer.resize(nextProps.width, nextProps.height);
      this.viewPosition.resize(nextProps.width, nextProps.height);
      this.statusBar.resize(nextProps.width, nextProps.height);
      this.backgroundArea.hitArea = new PIXI.Rectangle(
        0,
        0,
        nextProps.width,
        nextProps.height
      );

      // Avoid flickering that could happen while waiting for next animation frame.
      this.fpsLimiter.forceNextUpdate();
      this._renderScene();
    }

    if (nextProps.options !== this.props.options) {
      this.grid.setOptions(nextProps.options);
      this.instancesMover.setOptions(nextProps.options);
      this.instancesResizer.setOptions(nextProps.options);
      this.windowMask.setOptions(nextProps.options);
      this.viewPosition.setOptions(nextProps.options);
      this._instancesAdder.setOptions(nextProps.options);
    }

    if (nextProps.screenType !== this.props.screenType) {
      this.selectedInstances.setScreenType(this.props.screenType);
    }

    if (
      this.props.layout !== nextProps.layout ||
      this.props.initialInstances !== nextProps.initialInstances ||
      this.props.project !== nextProps.project
    ) {
      this._mountEditorComponents(nextProps);
    }

    // For avoiding useless renderings, which is costly for CPU/GPU, when the editor
    // is not displayed, `pauseRendering` prop can be set to true.
    if (nextProps.pauseRendering && !this.props.pauseRendering)
      this.pauseSceneRendering();

    if (!nextProps.pauseRendering && this.props.pauseRendering)
      this.restartSceneRendering();
  }

  /**
   * Delete instance renderers of the specified objects, which will then be recreated during
   * the next render. Call this when an object resources may have changed (for example, a modified image),
   * and you want the instances of objects to reflect the changes.
   * See also ResourcesLoader and PixiResourcesLoader.
   * @param {string} objectName The name of the object for which instance must be re-rendered.
   */
  resetRenderersFor(objectName) {
    if (this.instancesRenderer)
      this.instancesRenderer.resetRenderersFor(objectName);
  }

  zoomBy(value) {
    this.setZoomFactor(this.getZoomFactor() + value);
  }

  getZoomFactor = () => {
    return this.props.options.zoomFactor;
  };

  setZoomFactor = zoomFactor => {
    this.props.onChangeOptions({
      zoomFactor: Math.max(Math.min(zoomFactor, 10), 0.01),
    });
  };

  /**
   * Immediately add instances for the specified objects at the given
   * position (in scene coordinates).
   */
  addInstances = (
    pos /*: [number, number] */,
    objectNames /*: Array<string> */
  ) => {
    this._instancesAdder.addInstances(pos, objectNames);
  };

  _onMouseMove = (x, y) => {
    this.lastCursorX = x;
    this.lastCursorY = y;
  };

  _onBackgroundClicked = (x, y) => {
    this.lastCursorX = x;
    this.lastCursorY = y;
    this.pixiRenderer.view.focus();

    // Selection rectangle is only drawn in _onPanMove,
    // which can happen a few milliseconds after a background
    // click/touch - enough to have the selection rectangle being
    // offset from the first click - which looks laggy. Set
    // the start position now.
    this.selectionRectangle.startSelectionRectangle(x, y);

    if (
      !this.keyboardShortcuts.shouldMultiSelect() &&
      !this.keyboardShortcuts.shouldMoveView()
    ) {
      this.props.instancesSelection.clearSelection();
      this.props.onInstancesSelected([]);
    }
  };

  _onPanMove = (deltaX, deltaY, x, y) => {
    if (this.keyboardShortcuts.shouldMoveView()) {
      const sceneDeltaX = deltaX / this.getZoomFactor();
      const sceneDeltaY = deltaY / this.getZoomFactor();

      this.viewPosition.scrollBy(-sceneDeltaX, -sceneDeltaY);

      if (this.props.onViewPositionChanged) {
        this.props.onViewPositionChanged(this.viewPosition);
      }
    } else {
      this.selectionRectangle.updateSelectionRectangle(x, y);
    }
  };

  _getLayersVisibility = () => {
    const { layout } = this.props;
    const layersVisibility = {};
    for (let i = 0; i < layout.getLayersCount(); i++) {
      layersVisibility[layout.getLayerAt(i).getName()] = layout
        .getLayerAt(i)
        .getVisibility();
    }
    return layersVisibility;
  };

  _onPanEnd = () => {
    // When a pan is ended, this can be that either the user was making
    // a selection, or that the user was moving the view.
    if (this.selectionRectangle.hasStartedSelectionRectangle()) {
      let instancesSelected = this.selectionRectangle.endSelectionRectangle();

      this.props.instancesSelection.selectInstances(
        instancesSelected,
        this.keyboardShortcuts.shouldMultiSelect(),
        this._getLayersVisibility()
      );
      instancesSelected = this.props.instancesSelection.getSelectedInstances();
      this.props.onInstancesSelected(instancesSelected);
    }
  };

  _onInstanceClicked = instance => {
    this.pixiRenderer.view.focus();
  };

  _onOverInstance = instance => {
    this.highlightedInstance.setInstance(instance);
  };

  _onDownInstance = instance => {
    if (this.keyboardShortcuts.shouldMoveView()) {
      // If the user wants to move the view, discard the click on an instance:
      // it's just the beginning of the user panning the view.
      return;
    }

    if (this.keyboardShortcuts.shouldCloneInstances()) {
      const selectedInstances = this.props.instancesSelection.getSelectedInstances();
      for (var i = 0; i < selectedInstances.length; i++) {
        const instance = selectedInstances[i];
        this.props.initialInstances.insertInitialInstance(instance);
      }
    } else {
      this.props.instancesSelection.selectInstance(
        instance,
        this.keyboardShortcuts.shouldMultiSelect(),
        this._getLayersVisibility()
      );

      if (this.props.onInstancesSelected) {
        this.props.onInstancesSelected(
          this.props.instancesSelection.getSelectedInstances()
        );
      }
    }
  };

  _onOutInstance = instance => {
    if (instance === this.highlightedInstance.getInstance())
      this.highlightedInstance.setInstance(null);
  };

  _onMoveInstance = (instance, deltaX, deltaY) => {
    const sceneDeltaX = deltaX / this.getZoomFactor();
    const sceneDeltaY = deltaY / this.getZoomFactor();

    // It is possible for the user to start moving an instance, then press the button
    // to move the view, move it, then unpress it and continue to move the instance.
    // This means that while we're in "_onMoveInstance", we must handle view moving.
    if (this.keyboardShortcuts.shouldMoveView()) {
      this.viewPosition.scrollBy(-sceneDeltaX, -sceneDeltaY);

      if (this.props.onViewPositionChanged) {
        this.props.onViewPositionChanged(this.viewPosition);
      }
      return;
    }

    if (!this.props.instancesSelection.isInstanceSelected(instance)) {
      this._onInstanceClicked(instance);
    }

    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    this.instancesMover.moveBy(
      selectedInstances,
      sceneDeltaX,
      sceneDeltaY,
      this.keyboardShortcuts.shouldFollowAxis(),
      this.keyboardShortcuts.shouldNotSnapToGrid()
    );
  };

  _onMoveInstanceEnd = () => {
    this.instancesMover.endMove();

    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    this.props.onInstancesMoved(selectedInstances);
  };

  _onResize = (deltaX, deltaY) => {
    const sceneDeltaX = deltaX / this.getZoomFactor();
    const sceneDeltaY = deltaY / this.getZoomFactor();

    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    this.instancesResizer.resizeBy(
      selectedInstances,
      sceneDeltaX,
      sceneDeltaY,
      this.keyboardShortcuts.shouldResizeProportionally()
    );
  };

  _onResizeEnd = () => {
    this.instancesResizer.endResize();

    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    this.props.onInstancesResized(selectedInstances);
  };

  _onRotate = (deltaX, deltaY) => {
    const sceneDeltaX = deltaX / this.getZoomFactor();
    const sceneDeltaY = deltaY / this.getZoomFactor();

    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    this.instancesRotator.rotateBy(
      selectedInstances,
      sceneDeltaX,
      sceneDeltaY,
      this.keyboardShortcuts.shouldResizeProportionally()
    );
  };

  _onRotateEnd = () => {
    this.instancesRotator.endRotate();

    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    this.props.onInstancesRotated(selectedInstances);
  };

  clearHighlightedInstance = () => {
    this.highlightedInstance.setInstance(null);
  };

  moveSelection = (x, y) => {
    const selectedInstances = this.props.instancesSelection.getSelectedInstances();
    selectedInstances.forEach(instance => {
      instance.setX(instance.getX() + x);
      instance.setY(instance.getY() + y);
    });
    this.props.onInstancesMoved(selectedInstances);
  };

  scrollTo(x, y) {
    this.viewPosition.scrollTo(x, y);
  }

  centerView() {
    const x = this.props.project.getMainWindowDefaultWidth() / 2;
    const y = this.props.project.getMainWindowDefaultHeight() / 2;
    this.viewPosition.scrollTo(x, y);
  }

  centerViewOn(instances) {
    if (!instances.length) return;

    this.viewPosition.scrollToInstance(instances[instances.length - 1]);
    if (this.props.onViewPositionChanged) {
      this.props.onViewPositionChanged(this.viewPosition);
    }
  }

  getLastContextMenuSceneCoordinates = () => {
    return this.viewPosition.toSceneCoordinates(
      this.lastContextMenuX,
      this.lastContextMenuY
    );
  };

  getLastCursorSceneCoordinates = () => {
    return this.viewPosition.toSceneCoordinates(
      this.lastCursorX,
      this.lastCursorY
    );
  };

  getViewPosition = () /*: ?ViewPosition */ => {
    return this.viewPosition;
  };

  _renderScene = () => {
    // Protect against rendering scheduled after the component is unmounted.
    if (this._unmounted) return;
    if (this._renderingPaused) return;

    // Avoid killing the CPU by limiting the rendering calls.
    if (this.fpsLimiter.shouldUpdate()) {
      this.backgroundColor.render();
      this.viewPosition.render();
      this.canvasCursor.render();
      this.grid.render();
      this.instancesRenderer.render();
      this.highlightedInstance.render();
      this.selectedInstances.render();
      this.selectionRectangle.render();
      this.windowBorder.render();
      this.windowMask.render();
      this.statusBar.render();
      this.pixiRenderer.render(this.pixiContainer);
    }
    this.nextFrame = requestAnimationFrame(this._renderScene);
  };

  pauseSceneRendering = () => {
    if (this.nextFrame) cancelAnimationFrame(this.nextFrame);
    this._renderingPaused = true;

    stopPIXITicker();
  };

  restartSceneRendering = () => {
    this._renderingPaused = false;
    this._renderScene();

    startPIXITicker();
  };

  render() {
    if (!this.props.project) return null;

    return (
      <DropTarget
        canDrop={() => true}
        hover={monitor => {
          const { _instancesAdder, viewPosition, canvasArea } = this;
          if (!_instancesAdder || !canvasArea || !viewPosition) return;

          const { x, y } = monitor.getClientOffset();
          const canvasRect = canvasArea.getBoundingClientRect();
          const pos = viewPosition.toSceneCoordinates(
            x - canvasRect.left,
            y - canvasRect.top
          );
          _instancesAdder.createOrUpdateTemporaryInstancesFromObjectNames(
            pos,
            this.props.selectedObjectNames
          );
        }}
        drop={monitor => {
          const { _instancesAdder, viewPosition, canvasArea } = this;
          if (!_instancesAdder || !canvasArea || !viewPosition) return;

          if (monitor.didDrop()) {
            // Drop was done somewhere else (in a child of the canvas:
            // should not happen, but still handling this case).
            _instancesAdder.deleteTemporaryInstances();
            return;
          }

          const { x, y } = monitor.getClientOffset();
          const canvasRect = canvasArea.getBoundingClientRect();
          const pos = viewPosition.toSceneCoordinates(
            x - canvasRect.left,
            y - canvasRect.top
          );
          _instancesAdder.updateTemporaryInstancePositions(pos);
          _instancesAdder.commitTemporaryInstances();
          this.props.onInstancesAdded();
        }}
      >
        {({ connectDropTarget, isOver }) => {
          // The children are re-rendered when isOver change:
          // take this opportunity to delete any temporary instances
          // if the dragging is not done anymore over the canvas.
          if (this._instancesAdder && !isOver) {
            this._instancesAdder.deleteTemporaryInstances();
          }

          return connectDropTarget(
            <div
              ref={canvasArea => (this.canvasArea = canvasArea)}
              style={{
                ...styles.canvasArea,
                ...(this.props.showDropCursor ? styles.dropCursor : undefined),
              }}
            />
          );
        }}
      </DropTarget>
    );
  }
}
