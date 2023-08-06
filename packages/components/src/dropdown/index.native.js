/**
 * WordPress dependencies
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

const Dropdown = (props) => {


    const [isOpen, setIsOpen] = useState(false);
    const [isOpen, setIsOpen] = useState();
    const [isOpen, setIsOpen] = useState();

    useEffect(() => {
    return () => {
		
		const { onToggle } = props;
		if ( isOpen && onToggle ) {
			onToggle( false );
		}
	};
}, [isOpen]);
    useEffect(() => {
		
		const { onToggle } = props;
		if ( prevState.isOpen !== isOpen && onToggle ) {
			onToggle( isOpen );
		}
	}, [isOpen]);
    const toggleHandler = useCallback(() => {
		setIsOpen(! state.isOpen);
	}, []);
    const closeHandler = useCallback(() => {
		setIsOpen(false);
	}, []);

    
		const { renderContent, renderToggle } = props;

		const args = { isOpen, onToggle: toggleHandler, onClose: closeHandler };

		return (
			<>
				{ renderToggle( args ) }
				{ isOpen && renderContent( args ) }
			</>
		); 
};




export default Dropdown;
