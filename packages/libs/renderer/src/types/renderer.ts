/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import type { Subscribable } from 'rxjs'
import { Scene } from './scene'
import { Node, GraphContainer } from '@graspologic/graph'
import { RenderConfiguration } from '@graspologic/common'
import { Camera } from '@graspologic/camera'

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
	readonly onDirty: Subscribable<void>

	/**
	 * Subscribe to data loads
	 * @param handler
	 */
	readonly onLoad: Subscribable<void>

	/**
	 * Subscribe to resizes
	 * @param handler
	 */
	readonly onResize: Subscribable<void>

	/**
	 * Subscribable for when a vertex is clicked on
	 */
	onVertexClick: Subscribable<Node | undefined>

	/**
	 * Subscribable for when a vertex is hovered over
	 */
	onVertexHover: Subscribable<Node | undefined>

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

export enum VisualDimensions {
	TwoD = '2D',
	ThreeD = '3D',
}

/**
 * A mapping between a key and a position object
 */
export interface PositionMap {
	[key: string]: { x: number; y: number; z?: number }
}

/**
 * Provides a component based color for the given node
 * @param group The group of the node
 * @param id The id of the node
 * @returns A color in the form of [r, g, b, a] components
 */
export type NodeComponentColorizer = (
	group: string | number | undefined,
	id: string | number | undefined,
) => [number, number, number, number]

/**
 * Provides a color for the given node
 * @param group The group of the node
 * @param id The id of the node
 * @returns A color in the form of 0xbbggrraa
 */
export type NodeBGRAColorizer = (
	group: string | number | undefined,
	id: string | number | undefined,
) => number

/**
 * Provides a color for the given node
 * @param group The group of the node
 * @param id The id of the node
 * @returns A color in the form of [r, g, b, a] components or an int color
 */
export type NodeColorizer = (
	group: string | number | undefined,
	id: string | number | undefined,
) => [number, number, number, number] | number