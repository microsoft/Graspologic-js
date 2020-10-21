/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
const { configure } = require('@essex/jest-config')
const config = configure(
	['<rootDir>/jest.setup.js'],
	'<rootDir>/tsconfig.jest.json',
)
config.moduleNameMapper['\\.(glsl)'] = '<rootDir>/jest.glsl.stub.js'
module.exports = config
