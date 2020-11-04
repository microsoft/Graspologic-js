/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { useEffect } from 'react'
import { GraphRenderer, Node, DataboundRenderable } from '@graspologic/renderer'

/**
 * Updates __renderable__ with the set of nodes which match the __vertexIds__ ids, when __vertexIds__ changes
 * @param renderer The renderer
 * @param renderable The renderable to syncronize
 * @param vertexIds The set of vertex ids
 */
export function useVertexSelectionSynchronization(
	renderer: GraphRenderer | undefined,
	renderable: DataboundRenderable<Node[]> | undefined,
	vertexIds: string[],
) {
	useEffect(() => {
		if (renderer && renderable) {
			renderer.awaitKickoff().then(() => {
				const vertices = Array.from(
					renderer.scene.primitives(new Set(vertexIds), false),
				)
				renderable.setData(vertices as Node[])
			})
		}
	}, [renderer, renderable, vertexIds])
}
