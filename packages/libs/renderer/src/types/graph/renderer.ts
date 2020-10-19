/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { Node, GraphContainer } from '@graspologic/graph'
import { Observable, Subscription } from 'rxjs'
import { Camera } from '../../renderer/delegates'
import { PropertyChangeHandler } from '../../util'
import { CameraAdjustmentMode } from '../camera'
import { PositionMap, NodeComponentColorizer, ColorVector } from './graphData'
import { Scene } from './scene'

/**
 * The set of graph renderer configuration options
 */
export interface RenderConfigurationOptions {
	/**
	 * The background color of the renderer
	 */
	backgroundColor: ColorVector

	/**
	 * If true, the axes will be shown in the corner
	 */
	cornerAxes: boolean

	/**
	 * If true, the axes will be drawn
	 */
	drawAxes: boolean

	/**
	 * If true, the edges will be drawn
	 */
	drawEdges: boolean

	/**
	 * If true, the nodes will be drawn
	 */
	drawNodes: boolean

	/**
	 * The opacity to apply to the edges, 0 (fully transparent) -> 1 (fully opaque)
	 */
	edgeAlpha: number

	/**
	 * If true, edges will be antialiased
	 */
	edgeAntialias: boolean

	/**
	 * If true, edges will be drawn with a constant width, regardless of zoom
	 */
	edgeConstantWidth: boolean

	/**
	 * If true, edges closer to the camera will occlude further edges
	 */
	edgeDepthWrite: boolean

	/**
	 * The saturation of edges which are _in_ the filtered set
	 */
	edgeFilteredInSaturation: number

	/**
	 * The saturation of edges which are _not in_ the filtered set
	 */
	edgeFilteredOutSaturation: number

	/**
	 * The maximum width of the edges
	 */
	edgeMaxWidth: number

	/**
	 * The minimum width of the edges
	 */
	edgeMinWidth: number

	/**
	 * If true, non-selected vertices will be hidden
	 */
	hideDeselected: boolean

	/**
	 * If true, edges will be hidden while the user is panning/zooming
	 */
	hideEdgesOnMove: boolean

	/**
	 * If true, nodes will be hidden while the user is panning/zooming
	 */
	hideNodesOnMove: boolean

	/**
	 * The default color to highlight nodes when they are hovered
	 */
	hoverHighlightColor: ColorVector

	/**
	 * The amount of time to transition between 3d mode and 2d mode
	 */
	interpolationTime: number

	/**
	 * If true, the graph should be rendered in 3d
	 */
	is3D: boolean

	/**
	 * The set of filtered node ids
	 */
	nodeFilteredIds: string[] | undefined

	/**
	 * The saturation of nodes which are _in_ the filtered set
	 */
	nodeFilteredInSaturation: number

	/**
	 * The saturation of nodes which are _not in_ the filtered set
	 */
	nodeFilteredOutSaturation: number

	/**
	 * The maximum radius of the nodes
	 */
	nodeMaxRadius: number

	/**
	 * The minimum radius of the nodes
	 */
	nodeMinRadius: number

	/**
	 * If true, nodes will be drawn with an outline
	 */
	nodeOutline: boolean

	/**
	 * Provides a hint to the renderer about how many nodes are expected
	 * so data buffers can be preallocated with the optimal size, default = 10000
	 */
	nodeCountHint: number

	/**
	 * Provides a hint to the renderer about how many edges are expected
	 * so data buffers can be preallocated with the optimal size, default = 10000
	 */
	edgeCountHint: number

	/**
	 * The width of the canvas, default = 500
	 */
	width: number

	/**
	 * The height of the canvas, default = 500
	 */
	height: number

	/**
	 * The camera mode to use
	 */
	cameraAdjustmentMode: CameraAdjustmentMode

	/**
	 * If true, when nodes/edges are dynamically changed, the data will automatically be rebound to the renderer
	 */
	autoBind: boolean
}

/**
 * Represents a set of configuration options to control the graph renderer
 */
export interface RenderConfiguration extends RenderConfigurationOptions {
	onBackgroundColorChanged(
		handler: PropertyChangeHandler<ColorVector>,
	): Subscription
	onDrawEdgesChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onHideEdgesOnMoveChanged(
		handler: PropertyChangeHandler<boolean>,
	): Subscription
	onDrawNodesChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onHideNodesOnMoveChanged(
		handler: PropertyChangeHandler<boolean>,
	): Subscription
	onHideDeselectedChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onEdgeConstantWidthChanged(
		handler: PropertyChangeHandler<boolean>,
	): Subscription
	onEdgeDepthWriteChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onEdgeAlphaChanged(handler: PropertyChangeHandler<number>): Subscription
	onEdgeAntialiasChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onEdgeMinWidthChanged(handler: PropertyChangeHandler<number>): Subscription
	onEdgeMaxWidthChanged(handler: PropertyChangeHandler<number>): Subscription
	onNodeMinRadiusChanged(handler: PropertyChangeHandler<number>): Subscription
	onNodeMaxRadiusChanged(handler: PropertyChangeHandler<number>): Subscription
	onNodeOutlineChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onCornerAxesChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onDrawAxesChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onInterpolationTimeChanged(
		handler: PropertyChangeHandler<number>,
	): Subscription
	onHoverHighlightColorChanged(
		handler: PropertyChangeHandler<number[]>,
	): Subscription
	onIs3DChanged(handler: PropertyChangeHandler<boolean>): Subscription
	onEdgeFilteredOutSaturationChanged(
		handler: PropertyChangeHandler<number>,
	): Subscription
	onEdgeFilteredInSaturationChanged(
		handler: PropertyChangeHandler<number>,
	): Subscription
	onNodeFilteredOutSaturationChanged(
		handler: PropertyChangeHandler<number>,
	): Subscription
	onNodeFilteredInSaturationChanged(
		handler: PropertyChangeHandler<number>,
	): Subscription
	onNodeFilteredIdsChanged(
		handler: PropertyChangeHandler<string[] | undefined>,
	): Subscription
	onNodeCountHintChanged(handler: PropertyChangeHandler<number>): Subscription
	onEdgeCountHintChanged(handler: PropertyChangeHandler<number>): Subscription
	onWidthChanged(handler: PropertyChangeHandler<number>): Subscription
	onHeightChanged(handler: PropertyChangeHandler<number>): Subscription
	onCameraAdjustmentModeChanged(
		handler: PropertyChangeHandler<CameraAdjustmentMode>,
	): Subscription
	copy(): RenderConfigurationOptions
	load(options: Partial<RenderConfigurationOptions>): void
}

export type InitializeHandler<T> = (context: T) => void

/**
 * An interface indicating that a renderer uses WebGL
 */
export interface UsesWebGL {
	/**
	 * Returns the webgl context
	 */
	readonly gl: WebGLRenderingContext
}

/**
 * Renderer for rendering a graph
 */
export interface GraphRenderer {
	/**
	 * Gets the camera
	 */
	readonly camera: Camera

	/**
	 * Gets whether or not the renderer has been destroyed
	 */
	readonly destroyed: boolean

	/**
	 * Returns the underlying graph structure
	 */
	readonly graph: GraphContainer

	/**
	 * Gets the current render configuration
	 */
	config: RenderConfiguration

	/**
	 * Subscribe to dirty changes
	 * @param handler
	 */
	readonly onDirty: Observable<void>

	/**
	 * Subscribe to data loads
	 * @param handler
	 */
	readonly onLoad: Observable<void>

	/**
	 * Subscribe to resizes
	 * @param handler
	 */
	readonly onResize: Observable<void>

	/**
	 * Observable for when a vertex is clicked on
	 */
	onVertexClick: Observable<Node | undefined>

	/**
	 * Observable for when a vertex is hovered over
	 */
	onVertexHover: Observable<Node | undefined>

	/**
	 * Gets the scene, on which nodes and edges can be added
	 */
	scene: Scene

	/**
	 * Returns the canvas behind the graph renderer
	 */
	view: HTMLElement

	/**
	 * @internal
	 *
	 * Lets the renderer know that a node has been clicked
	 */
	handleClicked(): void

	/**
	 * Add an initialization callback
	 */
	onInitialize<T>(initializeHandler: InitializeHandler<T>): void

	// #endregion

	/**
	 * Loads the given graph into the renderer
	 * @param data The graph to load
	 * @param colorizer The colorizer function which determines the color of a node
	 */
	load(data: GraphContainer, colorizer?: NodeComponentColorizer): void

	/**
	 * Changes the position of the given nodes
	 * @param newPositions The new positions of the nodes
	 * @param duration The optional duration for how long the transition should take
	 */
	changePositions(newPositions: PositionMap, duration?: number): void

	/**
	 * Resizes the renderer
	 * @param width The width of the canvas
	 * @param height The height of the canvas
	 */
	resize(width: number, height: number): void

	/**
	 * Makes the graph renderer "dirty", so on the next render it will repaint itself
	 */
	makeDirty(): void

	/**
	 * A wrapper around camera.viewBounds to ensure that the currently loaded graph is in view
	 * @param duration The amount of time to take transitioning to the new view
	 */
	zoomToGraph(duration?: number): void

	/**
	 * A wrapper around camera.viewBounds to match the viewport
	 * @param duration The amount of time to take transitioning to the new view
	 */
	zoomToViewport(duration?: number): void

	/**
	 * Updates the weights in the graph
	 */
	updateWeights(): void

	/**
	 * Starts the animation loop
	 */
	start(): void

	/**
	 * Stops the animation loop
	 */
	stop(): void

	/**
	 * Renders the graph
	 * @param delta The optional *engine time* diff since the last render, changing this will speed up or slow down animations
	 * @returns The delta, either computed or the parameter passed to the function
	 */
	render(delta?: number): number

	/**
	 * Returns a promise that is resolved before the first render
	 */
	awaitKickoff(): Promise<void>

	/**
	 * Destroy's the graph renderer
	 */
	destroy(): void

	/**
	 * @internal
	 *
	 * Forces a re-bind to the underlying data store
	 */
	rebind(): void
}
