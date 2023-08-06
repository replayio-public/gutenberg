/**
 * External dependencies
 */

import {
    requireNativeComponent,
    UIManager,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
    BACKSPACE,
    DELETE,
    DOWN,
    ENTER,
    ESCAPE,
    LEFT,
    RIGHT,
    SPACE,
    UP,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import * as AztecInputState from './AztecInputState';

const AztecManager = UIManager.getViewManagerConfig( 'RCTAztecView' );

// Used to match KeyboardEvent.code values (from the Web API) with native keycodes.
const KEYCODES = {
	[ BACKSPACE ]: 'Backspace',
	[ DELETE ]: 'Delete',
	[ DOWN ]: 'ArrowDown',
	[ ENTER ]: 'Enter',
	[ ESCAPE ]: 'Escape',
	[ LEFT ]: 'ArrowLeft',
	[ RIGHT ]: 'ArrowRight',
	[ SPACE ]: 'Space',
	[ UP ]: 'ArrowUp',
};

const AztecView = (props) => {


    

    const dispatchHandler = useCallback(( command, params ) => {
		params = params || [];
		UIManager.dispatchViewManagerCommand(
			aztecViewRefHandler.current,
			command,
			params
		);
	}, []);
    const requestHTMLWithCursorHandler = useCallback(() => {
		dispatchHandler( AztecManager.Commands.returnHTMLWithCursor );
	}, []);
    const _onContentSizeChangeHandler = useCallback(( event ) => {
		if ( ! props.onContentSizeChange ) {
			return;
		}
		const size = event.nativeEvent.contentSize;
		const { onContentSizeChange } = props;
		onContentSizeChange( size );
	}, []);
    const _onEnterHandler = useCallback(( event ) => {
		if ( ! isFocusedHandler() ) {
			return;
		}

		if ( ! props.onKeyDown ) {
			return;
		}

		const { onKeyDown } = props;

		const newEvent = { ...event, keyCode: ENTER, code: KEYCODES[ ENTER ] };
		onKeyDown( newEvent );
	}, []);
    const _onBackspaceHandler = useCallback(( event ) => {
		if ( ! props.onKeyDown ) {
			return;
		}

		const { onKeyDown } = props;

		const newEvent = {
			...event,
			keyCode: BACKSPACE,
			code: KEYCODES[ BACKSPACE ],
			preventDefault: () => {},
		};
		onKeyDown( newEvent );
	}, []);
    const _onKeyDownHandler = useCallback(( event ) => {
		if ( ! props.onKeyDown ) {
			return;
		}

		const { onKeyDown } = props;
		const { keyCode } = event.nativeEvent;
		const newEvent = {
			...event,
			keyCode,
			...( KEYCODES[ keyCode ] && {
				code: KEYCODES[ keyCode ],
			} ),
			preventDefault: () => {},
		};
		onKeyDown( newEvent );
	}, []);
    const _onHTMLContentWithCursorHandler = useCallback(( event ) => {
		if ( ! props.onHTMLContentWithCursor ) {
			return;
		}

		const text = event.nativeEvent.text;
		const selectionStart = event.nativeEvent.selectionStart;
		const selectionEnd = event.nativeEvent.selectionEnd;
		const { onHTMLContentWithCursor } = props;
		onHTMLContentWithCursor( text, selectionStart, selectionEnd );
	}, []);
    const _onFocusHandler = useCallback(( event ) => {
		if ( ! props.onFocus ) {
			return;
		}

		const { onFocus } = props;
		onFocus( event );
	}, []);
    const _onBlurHandler = useCallback(( event ) => {
		selectionEndCaretYHandler = null;

		AztecInputState.blur( aztecViewRefHandler.current );

		if ( ! props.onBlur ) {
			return;
		}

		const { onBlur } = props;
		onBlur( event );
	}, []);
    const _onChangeHandler = useCallback(( event ) => {
		// iOS uses the onKeyDown prop directly from native only when one of the triggerKeyCodes is entered, but
		// Android includes the information needed for onKeyDown in the event passed to onChange.
		if ( Platform.OS === 'android' ) {
			const triggersIncludeEventKeyCode =
				props.triggerKeyCodes &&
				props.triggerKeyCodes
					.map( ( char ) => char.charCodeAt( 0 ) )
					.includes( event.nativeEvent.keyCode );
			if ( triggersIncludeEventKeyCode ) {
				_onKeyDownHandler( event );
			}
		}

		const { onChange } = props;
		if ( onChange ) {
			onChange( event );
		}
	}, []);
    const _onSelectionChangeHandler = useCallback(( event ) => {
		if ( props.onSelectionChange ) {
			const { selectionStart, selectionEnd, text } = event.nativeEvent;
			const { onSelectionChange } = props;
			onSelectionChange( selectionStart, selectionEnd, text, event );
		}

		if (
			props.onCaretVerticalPositionChange &&
			selectionEndCaretYHandler !== event.nativeEvent.selectionEndCaretY
		) {
			const caretY = event.nativeEvent.selectionEndCaretY;
			props.onCaretVerticalPositionChange(
				event.nativeEvent.target,
				caretY,
				selectionEndCaretYHandler
			);
			selectionEndCaretYHandler = caretY;
		}
	}, []);
    const blurHandler = useCallback(() => {
		AztecInputState.blur( aztecViewRefHandler.current );
	}, []);
    const focusHandler = useCallback(() => {
		AztecInputState.focus( aztecViewRefHandler.current );
	}, []);
    const isFocusedHandler = useCallback(() => {
		const focusedElement = AztecInputState.getCurrentFocusedElement();
		return focusedElement && focusedElement === aztecViewRefHandler.current;
	}, []);
    const _onPressHandler = useCallback(( event ) => {
		if ( ! isFocusedHandler() ) {
			focusHandler(); // Call to move the focus in RN way (TextInputState)
			_onFocusHandler( event ); // Check if there are listeners set on the focus event.
		}
	}, []);
    const _onAztecFocusHandler = useCallback(( event ) => {
		// IMPORTANT: the onFocus events from Aztec are thrown away on Android as these are handled by onPress() in the upper level.
		// It's necessary to do this otherwise onFocus may be set by `{...otherProps}` and thus the onPress + onFocus
		// combination generate an infinite loop as described in https://github.com/wordpress-mobile/gutenberg-mobile/issues/302
		// For iOS, this is necessary to let the system know when Aztec was focused programatically.
		if ( Platform.OS === 'ios' ) {
			_onPressHandler( event );
		}
	}, []);

    const { onActiveFormatsChange, ...otherProps } = props;
		// `style` has to be destructured separately, without `otherProps`, because of:
		// https://github.com/WordPress/gutenberg/issues/23611
		const { style } = props;

		if ( style.hasOwnProperty( 'lineHeight' ) ) {
			delete style.lineHeight;
			window.console.warn(
				"Removing lineHeight style as it's not supported by native AztecView"
			);
			// Prevents passing line-heigth within styles to avoid a crash due to values without units
			// We now support this but passing line-height as a prop instead.
		}

		return (
			<TouchableWithoutFeedback onPress={ _onPressHandler }>
				<RCTAztecView
					{ ...otherProps }
					style={ style }
					onContentSizeChange={ _onContentSizeChangeHandler }
					onHTMLContentWithCursor={ _onHTMLContentWithCursorHandler }
					onChange={ _onChangeHandler }
					onSelectionChange={ _onSelectionChangeHandler }
					onEnter={ props.onKeyDown && _onEnterHandler }
					onBackspace={ props.onKeyDown && _onBackspaceHandler }
					onKeyDown={ props.onKeyDown && _onKeyDownHandler }
					deleteEnter={ props.deleteEnter }
					// IMPORTANT: the onFocus events are thrown away as these are handled by onPress() in the upper level.
					// It's necessary to do this otherwise onFocus may be set by `{...otherProps}` and thus the onPress + onFocus
					// combination generate an infinite loop as described in https://github.com/wordpress-mobile/gutenberg-mobile/issues/302
					onFocus={ _onAztecFocusHandler }
					onBlur={ _onBlurHandler }
					ref={ aztecViewRefHandler }
				/>
			</TouchableWithoutFeedback>
		); 
};




const RCTAztecView = requireNativeComponent( 'RCTAztecView', AztecView );

AztecView.InputState = AztecInputState;

export default AztecView;
