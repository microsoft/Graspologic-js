/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { Model } from '@luma.gl/engine'
import { Buffer, readPixelsToArray } from '@luma.gl/webgl'

// This is causing problems downstream for some reason
// @ts-ignore
import { cssToDevicePixels } from '@luma.gl/gltools'
import { readTweenEndTime, restartTween } from '@graspologic/animation'
import { NodeStore, Node, nodeType } from '@graspologic/graph'
import { createIdFactory, GL_DEPTH_TEST, encodePickingColor, decodePickingColor, PickingColor } from '@graspologic/luma-utils'
import { DirtyableRenderable } from '@graspologic/renderables-base'
import { Bounds3D, RenderOptions, RenderConfiguration, ItemBasedRenderable, BoundedRenderable } from '@graspologic/common'

import createModel from './model'
import nodeVS from '@graspologic/renderer-glsl/dist/esm/shaders/node.vs.glsl'

const getNextId = createIdFactory('NodesInstance')
const RENDERER_BACKGROUND_INDEX = 16777214

const COLOR_TWEEN_ATTRIBUTE_NAME = 'color.tween'
const POSITION_TWEEN_ATTRIBUTE_NAME = 'position.tween'
const COLOR_DURATION_ATTRIBUTE_NAME = 'color.duration'
const POSITION_DURATION_ATTRIBUTE_NAME = 'position.duration'

/**
 * A renderable that can be added to the GraphRenderer which adds support for rendering nodes
 */
export class NodesRenderable extends DirtyableRenderable implements ItemBasedRenderable, BoundedRenderable {
	private readonly model: Model
	private readonly modelBuffer: Buffer
	private readonly translucentModel: Model
	private readonly translucentModelBuffer: Buffer
	private tweenUntil = 0
	private needsDataBind = true
	private _data: NodeStore | undefined
	private lastEngineTime: number = 0

	private pickingSelectedColor: PickingColor | undefined

	/**
	 * Constructor
	 * @param gl The gl context the nodes should be rendered to
	 * @param config The render configuration
	 * @param id The id of the renderable
	 */
	public constructor(
		gl: WebGLRenderingContext,
		protected config: RenderConfiguration,
		id = getNextId(),
	) {
		super()

		const { model, buffer } = createModel(gl, id, nodeVS)
		this.model = model
		this.modelBuffer = buffer

		const {
			model: translucentModel,
			buffer: translucentModelBuffer,
		} = createModel(gl, getNextId(), nodeVS, {
			ALPHA_MODE: 1,
		})

		this.translucentModel = translucentModel
		this.translucentModelBuffer = translucentModelBuffer

		config.onNodeMinRadiusChanged(this.makeDirtyHandler)
		config.onNodeMaxRadiusChanged(this.makeDirtyHandler)
		config.onNodeOutlineChanged(this.makeDirtyHandler)
		config.onDrawNodesChanged(this.makeDirtyHandler)
		config.onHideNodesOnMoveChanged(this.makeDirtyHandler)
	}

	/**
	 * Gets the data type associated with this renderable
	 */
	public get itemType(): symbol {
		return nodeType
	}

	/**
	 * Gets the node data that should be rendered
	 */
	public get data(): NodeStore | undefined {
		return this._data
	}

	/**
	 * Sets the node data that should be rendered
	 */
	public set data(value: NodeStore | undefined) {
		// We attach this here, because in the onChange handler it is fired after the changes happen
		if (value !== this._data && value) {
			value.onAttributeUpdated(this.handleNodeAttributeUpdated)
			value.onAddItem(this.handleNodeAdded)
			value.onRemoveItem(this.handleNodeRemoved)
			let node: Node
			for (node of value.scan()) {
				this.handleNodeAdded(node)
			}

			this.bindDataToModel(true)
			this.setNeedsRedraw(true)
		}
		this._data = value
	}

	/**
	 * Runs the hovered logic to determine what node is being hovered over
	 * @param param0
	 */
	public computeHovered({ gl, framebuffer, _mousePosition }: any): any {
		framebuffer.clear({ color: [0, 0, 0, 0], depth: true })
		// Render picking colors
		/* eslint-disable camelcase */
		this.model.setUniforms({ picking_uActive: 1 })
		this.model.draw({
			framebuffer,
			parameters: {
				depthMask: true,
				[GL_DEPTH_TEST]: true,
			},
		})
		this.model.setUniforms({ picking_uActive: 0 })
		const devicePixels = cssToDevicePixels(gl, _mousePosition)
		const deviceX = devicePixels.x + Math.floor(devicePixels.width / 2)
		const deviceY = devicePixels.y + Math.floor(devicePixels.height / 2)

		const pickingSelectedColor = readPixelsToArray(framebuffer, {
			sourceX: deviceX,
			sourceY: deviceY,
			sourceWidth: 1,
			sourceHeight: 1,
			sourceFormat: gl.RGBA,
			sourceType: gl.UNSIGNED_BYTE,
		})

		if (
			!this._comparePickingColors(
				pickingSelectedColor,
				this.pickingSelectedColor,
			)
		) {
			if (pickingSelectedColor !== null) {
				this.pickingSelectedColor = pickingSelectedColor
				const idx = decodePickingColor(this.pickingSelectedColor)
				this.dispatchEvent(new CustomEvent("nodeHovered", {
					detail: idx !== RENDERER_BACKGROUND_INDEX && idx >= 0
						? this.data?.itemAt(idx)
						: undefined
				}));
			} else {
				this.pickingSelectedColor = undefined
				this.dispatchEvent(new CustomEvent("nodeHovered", {}));
			}
		}
		return this.pickingSelectedColor
	}

	public preDraw(options: RenderOptions) {
		this.lastEngineTime = options.engineTime
	}

	/**
	 * Draws the NodesRenderable
	 * @param options The set of render options
	 */
	public draw(options: RenderOptions) {
		const {
			modelViewMatrix,
			projectionMatrix,
			hideDeselected,
			framebuffer,
			canvasPixelSize,
			engineTime,
			weightToPixel,
		} = options
		if (this.enabled) {
			this.bindDataToModel()

			// Keep looping redraws until tweening is done
			this.setNeedsRedraw(this.tweenUntil >= engineTime)

			const drawConfig = {
				parameters: {
					blend: true,
					depthMask: true,
					[GL_DEPTH_TEST]: true,
				},
				uniforms: {
					uModelView: modelViewMatrix,
					uProjection: projectionMatrix,
					uScreenSize: canvasPixelSize,
					uMinRadius: this.config.nodeMinRadius,
					uMaxRadius: this.config.nodeMaxRadius,
					uTime: engineTime,
					uWeightScale: weightToPixel,
					uOutline: this.config.nodeOutline ? 1.0 : 0.0,
				},
				framebuffer,
			}
			this.model.draw(drawConfig)
			if (
				!hideDeselected &&
				this.config.nodeFilteredIds &&
				this.config.nodeFilteredIds.length > 0
			) {
				drawConfig.parameters.depthMask = false
				this.translucentModel.draw(drawConfig)
			}
		}
	}

	/**
	 * Computes the bounds of the nodes
	 */
	public computeBounds(): Bounds3D | undefined {
		let bounds: Bounds3D | undefined
		let hasWeights = false
		let node: Node
		let radius: number = 0
		for (node of this._data!.scan()) {
			radius = node.radius
			if (!bounds) {
				bounds = {
					x: {
						min: node.x - radius,
						max: node.x + radius,
					},
					y: {
						min: node.y - radius,
						max: node.y + radius,
					},
					z: {
						min: node.z - radius,
						max: node.z + radius,
					},
				}
			} else {
				bounds!.x.min = Math.min(bounds!.x.min, node.x - radius)
				bounds!.x.max = Math.max(bounds!.x.max, node.x + radius)
	
				bounds!.y.min = Math.min(bounds!.y.min, node.y - radius)
				bounds!.y.max = Math.max(bounds!.y.max, node.y + radius)
	
				bounds!.z.min = Math.min(bounds!.z.min, node.z - radius)
				bounds!.z.max = Math.max(bounds!.z.max, node.z + radius)
			}

			if (!radius) {
				hasWeights = true
			}
		}
		const scale = hasWeights
			? this.config.nodeMaxRadius /
			  Math.min(this.config.width, this.config.height)
			: 0
		if (bounds) {
			const xWeightPadding = ((bounds.x.max - bounds.x.min) * scale) / 2.0
			const yWeightPadding = ((bounds.y.max - bounds.y.min) * scale) / 2.0
			return {
				x: {
					min: bounds.x.min - xWeightPadding,
					max: bounds.x.max + xWeightPadding,
				},
				y: {
					min: bounds.y.min - yWeightPadding,
					max: bounds.y.max + yWeightPadding,
				},
				z: {
					min: bounds.z.min - yWeightPadding,
					max: bounds.z.max + yWeightPadding,
				},
			}
		}
	}

	/**
	 * Binds the data in our databuffer to the model
	 * @param force Force a reload of all the data
	 */
	public bindDataToModel(forceAll = false) {
		let updated = false
		if (this.data) {
			updated = forceAll || this.needsDataBind
			if (updated) {
				this.needsDataBind = false
				const uint8 = this._data!.store.uint8Array
				this.modelBuffer.setData(uint8)
				this.translucentModelBuffer.setData(uint8)

				const instanceCount = this._data!.store.count
				this.model.setInstanceCount(instanceCount)
				this.translucentModel.setInstanceCount(instanceCount)
			}
		}
		return updated
	}

	/**
	 * Handler for when a node is added
	 * @param primitive The primitive to add
	 */
	protected handleNodeAdded = (nodeOrIndex: number | Node) => {
		const node =
			typeof nodeOrIndex === 'number'
				? this.data!.itemAt(nodeOrIndex)
				: nodeOrIndex

		// Assign node defaults
		node.saturation = 1
		node.visible = true

		const pickingColor = encodePickingColor(node.storeId)
		node.pickingColor = pickingColor as [number, number, number]
		this.needsDataBind = true
		this.setNeedsRedraw(true)
	}

	/**
	 * Removes a primitive from the scene
	 * @param primitive The primitive to remove
	 */
	protected handleNodeRemoved = (nodeOrIndex: number | Node) => {
		const node =
			typeof nodeOrIndex === 'number'
				? this.data!.itemAt(nodeOrIndex)
				: nodeOrIndex

		// Hide the node
		node.visible = false

		this.needsDataBind = true
		this.setNeedsRedraw(true)
	}

	/**
	 * Handler for when an attribute for a node is updated
	 */
	private handleNodeAttributeUpdated = (
		storeId: number,
		attribute?: string,
		value?: any,
	) => {
		if (!attribute) {
			// This makes sure tweening will renderc
			this.tweenUntil = Math.max(
				this.tweenUntil,
				readTweenEndTime(this.data!.store, storeId, POSITION_TWEEN_ATTRIBUTE_NAME),
				readTweenEndTime(this.data!.store, storeId, COLOR_TWEEN_ATTRIBUTE_NAME),
			)
		} else {
			// If it just writes 'duration', update it with the engine time
			if (attribute === POSITION_DURATION_ATTRIBUTE_NAME) {
				const startTime = restartTween(
					this.data!.store,
					storeId,
					POSITION_TWEEN_ATTRIBUTE_NAME,
					this.lastEngineTime,
				)
				this.tweenUntil = Math.max(this.tweenUntil, value + startTime)
			} else if (attribute === COLOR_DURATION_ATTRIBUTE_NAME) {
				const startTime = restartTween(
					this.data!.store,
					storeId,
					COLOR_TWEEN_ATTRIBUTE_NAME,
					this.lastEngineTime,
				)
				this.tweenUntil = Math.max(this.tweenUntil, value + startTime)

				// If they write the whole tween, then update the tween until
			} else if (
				attribute === POSITION_TWEEN_ATTRIBUTE_NAME ||
				attribute === COLOR_TWEEN_ATTRIBUTE_NAME
			) {
				this.tweenUntil = Math.max(this.tweenUntil, value[0] + value[1])
			}
		}
		this.needsDataBind = true
		this.setNeedsRedraw(true)
	}

	/**
	 * Compares two picking colors to see if they are equal
	 * @param color1 The first picking color
	 * @param color2 The second picking color
	 */
	private _comparePickingColors(color1: PickingColor | undefined, color2: PickingColor | undefined) {
		if (color1 && color2) {
			return (
				color1[0] === color2[0] &&
				color1[1] === color2[1] &&
				color1[2] === color2[2]
			)
		}
		return color1 === color2
	}
}
