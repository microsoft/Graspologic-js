/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
const { configure } = require('@essex/jest-config')
const baseConfig = configure();
const config = {
	testMatch: ['**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)'],
	rootDir: process.cwd(),
	roots: [process.cwd()],
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'@essex/jest-config/lib/filemock',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	collectCoverageFrom: [
		'**/src/**/*.{js,jsx,ts,tsx}',
		'!**/node_modules/**',
		'!**/vendor/**',
		'!**/dist/**',
		'!**/lib/**',
		'!**/assets/**',
		'!**/__tests__/**',
		'!.yarn/**',
	],
	coverageReporters: ['json', 'lcov', 'text', 'clover', 'cobertura'],
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}
console.log("BASE")
console.log(JSON.stringify(baseConfig, null, 2))
console.log("cfg")
console.log(JSON.stringify(config, null, 2))
module.exports = config
