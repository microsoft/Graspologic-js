/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { useEffect } from 'react'
import { GraphRenderer, Node, DataboundRenderable } from '@graspologic/renderer'

export function useVertexSelectionSynchronization(
	renderer: GraphRenderer | undefined,
	renderable: DataboundRenderable<Node[]> | undefined,
	vertexIds: string[],
) {
	useEffect(() => {
		if (renderer && renderable) {
			renderer.awaitKickoff().then(() => {
				const vertices = Array.from(
					renderer.scene.getPrimitives(new Set(vertexIds)),
				)
				renderable.setData(vertices as Node[])
			})
		}
	}, [renderer, renderable, vertexIds])
}
