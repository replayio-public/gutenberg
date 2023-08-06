/**
 * External dependencies
 */

import {
    Keyboard,
    LayoutAnimation,
    Platform,
    StyleSheet,
    View,
    Dimensions,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';

/**
 * This is a simplified version of Facebook's KeyboardAvoidingView.
 * It's meant to work specifically with BottomSheets.
 * This fixes an issue in the bottom padding calculation, when the
 * BottomSheet was presented on Landscape, with the keyboard already present,
 * and a TextField on Autofocus (situation present on Links UI)
 */
const KeyboardAvoidingView = (props) => {


    const [bottom, setBottom] = useState(0);

    const _relativeKeyboardHeight = useMemo(() => {
		if ( ! keyboardFrame ) {
			return 0;
		}

		const windowWidth = Dimensions.get( 'window' ).width;
		const isFloatingKeyboard = keyboardFrame.width !== windowWidth;
		if ( isFloatingKeyboard ) {
			return 0;
		}

		const windowHeight = Dimensions.get( 'window' ).height;
		const keyboardY =
			keyboardFrame.screenY - props.keyboardVerticalOffset;

		const final = Math.max( windowHeight - keyboardY, 0 );
		return final;
	}, []);
    /**
	 * @param {Object} event Keyboard event.
	 */
    const _onKeyboardChangeHandler = useCallback(( event ) => {
		if ( event === null ) {
			setBottom(0);
			return;
		}

		const { duration, easing, endCoordinates } = event;
		const height = _relativeKeyboardHeight( endCoordinates );

		if ( bottom === height ) {
			return;
		}

		if ( duration && easing ) {
			LayoutAnimation.configureNext( {
				duration,
				update: {
					duration,
					type: LayoutAnimation.Types[ easing ] || 'keyboard',
				},
			} );
		}
		setBottom(height);
	}, [bottom]);
    useEffect(() => {
		if ( Platform.OS === 'ios' ) {
			_subscriptionsHandler = [
				Keyboard.addListener(
					'keyboardWillChangeFrame',
					_onKeyboardChangeHandler
				),
			];
		}
	}, []);
    useEffect(() => {
    return () => {
		_subscriptionsHandler.forEach( ( subscription ) => {
			subscription.remove();
		} );
	};
}, []);

    const { children, enabled, keyboardVerticalOffset, style, ...props } =
			props;

		let finalStyle = style;
		if ( Platform.OS === 'ios' ) {
			const bottomHeight = enabled ? bottom : 0;
			finalStyle = StyleSheet.compose( style, {
				paddingBottom: bottomHeight,
			} );
		}

		return (
			<View style={ finalStyle } { ...props }>
				{ children }
			</View>
		); 
};




KeyboardAvoidingView.defaultProps = {
	enabled: true,
	keyboardVerticalOffset: 0,
};

export default KeyboardAvoidingView;
