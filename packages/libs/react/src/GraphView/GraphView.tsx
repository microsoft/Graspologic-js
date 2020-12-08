/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import * as React from 'react'
import { memo, forwardRef, useCallback, useMemo } from 'react'
import { SizedToParent } from '../SizedToParent'
import { GraphRendererContext } from './context'
import { use3DMode } from './hooks/use3DMode'
import { useBindCallbacks } from './hooks/useBindCallbacks'
import { useGraphContainer } from './hooks/useGraphContainer'
import { useGraphHideDeselected } from './hooks/useGraphHideDeselected'
import { useGraphImperativeApi } from './hooks/useGraphImperativeApi'
import { useGraphInterpolationTime } from './hooks/useGraphInterpolationTime'
import { useGraphRenderKickoff } from './hooks/useGraphRenderKickoff'
import { useGraphRenderer } from './hooks/useGraphRenderer'
import { useGraphRendererBackgroundColor } from './hooks/useGraphRendererBackgroundColor'
import { InputGraph, GraphContainer } from '@graspologic/graph'
import {
	ColorVector,
	DEFAULT_BG_COLOR,
	DEFAULT_HIDE_DESELECTED,
	DEFAULT_IS_3D,
	DEFAULT_INTERPOLATION_TIME,
	GraphRenderer,
	Maybe,
	Bounds,
} from '@graspologic/renderer'

const DEFAULT_STYLE = {
	width: 500,
	height: 500,
	position: 'relative',
} as React.CSSProperties

/**
 * Graph view properties
 */
export interface GraphViewProps {
	/**
	 * The CSS class name to inject into the containing div. The div will contain the canvas
	 * where the graph will render into.
	 */
	className?: string

	/**
	 * A CSS property object to be injected into the container div containing the graph rendering.
	 */
	style?: React.CSSProperties

	/**
	 * The background color to use in the graph view
	 */
	backgroundColor?: ColorVector

	/**
	 * The graph dataset
	 */
	data: InputGraph | GraphContainer

	/**
	 * The databounds for the graph
	 */
	dataBounds?: Maybe<Bounds>

	/**
	 * If true, non-selected vertices will be hidden
	 * @defaultValue [[DEFAULT_HIDE_DESELECTED]]
	 */
	hideDeselected?: boolean

	/**
	 * A flag indicating whether to render in 3D mode.
	 * @defaultValue [[DEFAULT_IS_3D]]
	 */
	is3D?: boolean

	/**
	 * Interpolation time for animations (default=1000)
	 * @defaultValue [[DEFAULT_INTERPOLATION_TIME]]
	 */
	interpolationTime?: number

	/**
	 * A ref to the underlying GraphRenderer
	 */
	ref?: React.Ref<GraphRenderer>

	/**
	 * Callback to be notified when the underlying renderer is ready.
	 */
	onInitialize?: (renderer: GraphRenderer) => void

	/**
	 * Callback to be notified when the data has finished loading in the renderer.
	 */
	onDataLoad?: () => void

	/**
	 * Callback to be notified when the graph renderer has been resized.
	 */
	onResize?: () => void
}

const GraphViewRaw: React.FC<GraphViewProps> = forwardRef<
	GraphRenderer,
	GraphViewProps
>(
	(
		{
			style,
			className,
			children,
			data,
			backgroundColor = DEFAULT_BG_COLOR,
			hideDeselected = DEFAULT_HIDE_DESELECTED,
			is3D = DEFAULT_IS_3D,
			interpolationTime = DEFAULT_INTERPOLATION_TIME,
			dataBounds,
			onInitialize,
			onDataLoad,
			onResize,
		},
		ref,
	) => {
		const graphContainer = useGraphContainer(data)
		const [renderRef, renderer] = useGraphRenderer(
			graphContainer,
			dataBounds,
		)
		useBindCallbacks({
			renderer,
			callbacks: {
				onInitialize,
				onLoad: onDataLoad,
				onResize,
			},
		})
		useGraphRendererBackgroundColor(renderer, backgroundColor)
		useGraphHideDeselected(renderer, hideDeselected)
		useGraphInterpolationTime(renderer, interpolationTime)
		useGraphImperativeApi(renderer, ref)
		use3DMode(renderer, is3D)
		useGraphRenderKickoff(renderer)
		const finalStyle = useMemo(
			() => ({
				...DEFAULT_STYLE,
				...(style || {}),
			}),
			[style],
		)
		const handleResize = useCallback(
			({ width, height }) => {
				if (renderer) {
					renderer.resize(width, height)
				}
			},
			[renderer],
		)

		return (
			<div className={className} style={finalStyle}>
				<SizedToParent sizedRef={renderRef} onResize={handleResize}>
					<GraphRendererContext.Provider value={renderer}>
						{children}
					</GraphRendererContext.Provider>
				</SizedToParent>
			</div>
		)
	},
)
GraphViewRaw.displayName = 'GraphView'

/**
 * The GraphView component. This is the entry point for rendering graph data.
 */
export const GraphView: React.FC<GraphViewProps> = memo(GraphViewRaw)
