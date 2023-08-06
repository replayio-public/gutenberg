/**
 * External dependencies
 */

import { Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import '@wordpress/interface';

/**
 * Internal dependencies
 */

export default export const Header = () => {


    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
		this.keyboardShowSubscription = Keyboard.addListener(
			'keyboardDidShow',
			this.keyboardDidShow
		);
		this.keyboardHideSubscription = Keyboard.addListener(
			'keyboardDidHide',
			this.keyboardDidHide
		);
	}, []);
    useEffect(() => {
    return () => {
		this.keyboardShowSubscription.remove();
		this.keyboardHideSubscription.remove();
	};
}, []);
    const keyboardDidShowHandler = useCallback(() => {
		this.setState( { isKeyboardVisible: true } );
	}, []);
    const keyboardDidHideHandler = useCallback(() => {
		this.setState( { isKeyboardVisible: false } );
	}, []);

    return (
			<HeaderToolbar
				showKeyboardHideButton={ this.state.isKeyboardVisible }
			/>
		); 
};



