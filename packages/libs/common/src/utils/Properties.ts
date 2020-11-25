/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { EventEmitterImpl } from './events'

export type PropertyChangeHandler<T> = (newValue: T) => void
export type PropertyChangeValidator<T> = (newValue: T) => boolean

export interface PropertyContainerEvents<T> {
	/**
	 * Event that is raised when the property is changed
	 * @param value The new value
	 */
	change(value: T | undefined): void
}

/**
 * @internal
 *
 * A class for managing a property that emits an event when it changes
 */
export class PropertyContainer<T> extends EventEmitterImpl<
	PropertyContainerEvents<T>
> {
	private isValid: PropertyChangeValidator<T> = () => true

	/**
	 * Constructor
	 * @param _value The current value
	 * @param areEqual An equality function
	 */
	public constructor(
		private _value: T,
		private areEqual = (a: T, b: T): boolean => a === b,
	) {
		super()
	}

	/**
	 * Sets the validator which validates whether or not a value is a valid value for this property container
	 * @param isValid The validator
	 */
	public checkValidity(isValid: PropertyChangeValidator<T>): void {
		this.isValid = isValid
	}

	/**
	 * Gets the value contained in the container
	 */
	public get value(): T {
		return this._value
	}

	/**
	 * Sets the value in the container
	 */
	public set value(newValue: T) {
		if (this.isValid(newValue) && !this.areEqual(newValue, this._value)) {
			this._value = newValue
			this.emit('change', newValue)
		}
	}
}
