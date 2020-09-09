/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { GraphContainer, Node, Edge } from '@graspologic/graph'
import { Colorizer } from '../types'
import { getColor } from '../util/getColor'

/**
 * @internal
 *
 * Processes the graph contained in __data__ by normalizing weights, and assigning colors using __colorizerFn__
 * @param data The graph data
 * @param colorizerFn The colorizer
 */
export function processGraph(
	data: GraphContainer,
	colorizerFn: Colorizer | undefined,
): void {
	const colorizer = getColorizer(colorizerFn)

	if (data.nodes.count === 0) {
		return
	}

	const [minWeight, maxWeight] = colorizeNodes(data, colorizer)
	normalizeNodeWeights(data, minWeight, maxWeight)
	normalizeEdgeWeights(data)
}

/**
 * Returns a colorizer function that returns a uint32 rather than the array of [r, g, b, a]
 * @param colorizerFn The colorizer function to wrap
 */
function getColorizer(colorizerFn: Colorizer = () => [1, 0, 0, 1]) {
	return (key: number) => {
		const arr = colorizerFn(key)
		const color = new ArrayBuffer(4)
		const view = new DataView(color)
		view.setUint8(0, Math.round(arr[0] * 255))
		view.setUint8(1, Math.round(arr[1] * 255))
		view.setUint8(2, Math.round(arr[2] * 255))
		view.setUint8(3, Math.round(arr[3] * 255))
		return view.getUint32(0, true)
	}
}

/**
 * Colorizes the nodes in __data__ using the __colorizer__ function
 * @param data The graph data
 * @param colorizer The colorizer function
 */
function colorizeNodes(
	data: GraphContainer,
	colorizer: (key: number) => number,
): [number, number] {
	const colorMap = new Map()
	let maxWeight = Number.MIN_SAFE_INTEGER
	let minWeight = Number.MAX_SAFE_INTEGER

	let node: Node
	for (node of data.nodes) {
		node.color = node.color || getColor(colorMap, colorizer, node.community)
		maxWeight = Math.max(maxWeight, node.weight)
		minWeight = Math.min(minWeight, node.weight)
	}
	return [minWeight, maxWeight]
}

/**
 * Normalizes the nodes weights using the __minWeight__ and __maxWeight__
 * @param data The graph data
 * @param minWeight The min weight for the nodes
 * @param maxWeight The max weight for the nodes
 */
function normalizeNodeWeights(
	data: GraphContainer,
	minWeight: number,
	maxWeight: number,
) {
	const nodeWeightDiff = maxWeight - minWeight
	let computeNodeWeight: (input: number) => number
	if (nodeWeightDiff === 0 || isNaN(nodeWeightDiff)) {
		computeNodeWeight = () => 0.5
	} else {
		const minNodeWeight = minWeight
		computeNodeWeight = (value: number) =>
			(value - minNodeWeight) / nodeWeightDiff
	}

	let node: Node
	for (node of data.nodes) {
		node.weight = computeNodeWeight(node.weight || 0)
	}
}

/**
 * Normalizes the edge weights using the __minWeight__ and __maxWeight__
 * @param data The graph data
 * @param minWeight The min weight for the edges
 * @param maxWeight The max weight for the edges
 */
function normalizeEdgeWeights(data: GraphContainer) {
	let edge: Edge
	let maxWeight = Number.MIN_SAFE_INTEGER
	let minWeight = Number.MAX_SAFE_INTEGER
	for (edge of data.edges) {
		maxWeight = Math.max(maxWeight, edge.weight!)
		minWeight = Math.min(minWeight, edge.weight!)
	}

	const edgeWeightDiff = maxWeight - minWeight
	let computeEdgeWeight
	if (edgeWeightDiff === 0) {
		computeEdgeWeight = () => 0.5
	} else {
		const minEdgeWeight = minWeight
		computeEdgeWeight = (value: number) =>
			(value - minEdgeWeight) / edgeWeightDiff
	}

	let source: Node
	let target: Node
	let finalSourceColor = 0
	let finalTargetColor = 0
	for (edge of data.edges) {
		source = data.nodes.itemAt(edge.sourceIndex)
		target = data.nodes.itemAt(edge.targetIndex)
		edge.trueWeight = edge.weight || 0
		edge.weight = computeEdgeWeight(edge.weight === undefined ? 1 : edge.weight)

		finalSourceColor = edge.color || source.color || 0
		finalTargetColor = edge.color2 || edge.color || target.color || 0

		edge.color = ((finalSourceColor ^ 0xff000000) | 0xff000000) >>> 0
		edge.color2 = ((finalTargetColor ^ 0xff000000) | 0xff000000) >>> 0

		edge.sourcePosition = source.position
		edge.targetPosition = target.position
	}
}
