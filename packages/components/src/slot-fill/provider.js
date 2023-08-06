// @ts-nocheck
/**
 * WordPress dependencies
 */

import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './context';

export default export const SlotFillProvider = (props) => {


    

    const registerSlotHandler = useCallback(( name, slot ) => {
		const previousSlot = this.slots[ name ];
		this.slots[ name ] = slot;
		this.triggerListeners();

		// Sometimes the fills are registered after the initial render of slot
		// But before the registerSlot call, we need to rerender the slot.
		this.forceUpdateSlot( name );

		// If a new instance of a slot is being mounted while another with the
		// same name exists, force its update _after_ the new slot has been
		// assigned into the instance, such that its own rendering of children
		// will be empty (the new Slot will subsume all fills for this name).
		if ( previousSlot ) {
			previousSlot.forceUpdate();
		}
	}, []);
    const registerFillHandler = useCallback(( name, instance ) => {
		this.fills[ name ] = [ ...( this.fills[ name ] || [] ), instance ];
		this.forceUpdateSlot( name );
	}, []);
    const unregisterSlotHandler = useCallback(( name, instance ) => {
		// If a previous instance of a Slot by this name unmounts, do nothing,
		// as the slot and its fills should only be removed for the current
		// known instance.
		if ( this.slots[ name ] !== instance ) {
			return;
		}

		delete this.slots[ name ];
		this.triggerListeners();
	}, []);
    const unregisterFillHandler = useCallback(( name, instance ) => {
		this.fills[ name ] =
			this.fills[ name ]?.filter( ( fill ) => fill !== instance ) ?? [];
		this.forceUpdateSlot( name );
	}, []);
    const getSlotHandler = useCallback(( name ) => {
		return this.slots[ name ];
	}, []);
    const getFillsHandler = useCallback(( name, slotInstance ) => {
		// Fills should only be returned for the current instance of the slot
		// in which they occupy.
		if ( this.slots[ name ] !== slotInstance ) {
			return [];
		}
		return this.fills[ name ];
	}, []);
    const hasFillsHandler = useCallback(( name ) => {
		return this.fills[ name ] && !! this.fills[ name ].length;
	}, []);
    const forceUpdateSlotHandler = useCallback(( name ) => {
		const slot = this.getSlot( name );

		if ( slot ) {
			slot.forceUpdate();
		}
	}, []);
    const triggerListenersHandler = useCallback(() => {
		this.listeners.forEach( ( listener ) => listener() );
	}, []);
    const subscribeHandler = useCallback(( listener ) => {
		this.listeners.push( listener );

		return () => {
			this.listeners = this.listeners.filter( ( l ) => l !== listener );
		};
	}, []);

    return (
			<SlotFillContext.Provider value={ this.contextValue }>
				{ this.props.children }
			</SlotFillContext.Provider>
		); 
};



