/**
 * WordPress dependencies
 */

import { useEffect, useCallback } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

const MetaBoxVisibility = (props) => {


    

    useEffect(() => {
		updateDOMHandler();
	}, []);
    useEffect(() => {
		if ( props.isVisible !== prevProps.isVisible ) {
			updateDOMHandler();
		}
	}, []);
    const updateDOMHandler = useCallback(() => {
		const { id, isVisible } = props;

		const element = document.getElementById( id );
		if ( ! element ) {
			return;
		}

		if ( isVisible ) {
			element.classList.remove( 'is-hidden' );
		} else {
			element.classList.add( 'is-hidden' );
		}
	}, []);

    return null; 
};




export default withSelect( ( select, { id } ) => ( {
	isVisible: select( editPostStore ).isEditorPanelEnabled(
		`meta-box-${ id }`
	),
} ) )( MetaBoxVisibility );
