/**
 * External dependencies
 */

import {
    AccessibilityInfo,
    View,
    TextInput,
    PixelRatio,
    AppState,
    Platform,
    Text,
    TouchableWithoutFeedback,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { toFixed, removeNonDigit } from '../utils';
import styles from './styles.scss';
import borderStyles from './borderStyles.scss';

const isIOS = Platform.OS === 'ios';

const RangeTextInput = (props) => {
const { value, defaultValue, min, decimalNum } = props;
    const initialValue = toFixed(
			value || defaultValue || min,
			decimalNum
		);
    const fontScale = getFontScaleHandler();

    const [inputValue, setInputValue] = useState(initialValue);
    const [controlValue, setControlValue] = useState(initialValue);
    const [hasFocus, setHasFocus] = useState(false);
    const [hasFocus, setHasFocus] = useState();
    const [inputValue, setInputValue] = useState();

    useEffect(() => {
		appStateChangeSubscriptionHandler = AppState.addEventListener(
			'change',
			handleChangePixelRatioHandler
		);
	}, []);
    useEffect(() => {
    return () => {
		appStateChangeSubscriptionHandler.remove();
		clearTimeout( timeoutAnnounceValueHandler );
	};
}, []);
    useEffect(() => {
		const { value } = props;
		

		if ( prevProps.value !== value ) {
			setInputValue(value);
		}

		if ( prevState.hasFocus !== hasFocus ) {
			const validValue = validateInputHandler( inputValue );
			setInputValue(validValue);
		}

		if ( ! prevState.hasFocus && hasFocus ) {
			_valueTextInputHandler.focus();
		}
	}, [hasFocus, inputValue]);
    const getFontScaleHandler = useCallback(() => {
		return PixelRatio.getFontScale() < 1 ? 1 : PixelRatio.getFontScale();
	}, []);
    const handleChangePixelRatioHandler = useCallback(( nextAppState ) => {
		if ( nextAppState === 'active' ) {
			setFontScale(getFontScaleHandler());
		}
	}, []);
    const onInputFocusHandler = useCallback(() => {
		setHasFocus(true);
	}, []);
    const onInputBlurHandler = useCallback(() => {
		
		onChangeTextHandler( `${ inputValue }` );
		setHasFocus(false);
	}, [inputValue]);
    const validateInputHandler = useCallback(( text ) => {
		const { min, max, decimalNum } = props;
		let result = min;
		if ( ! text ) {
			return min;
		}

		if ( typeof text === 'number' ) {
			result = Math.max( text, min );
			return max ? Math.min( result, max ) : result;
		}

		result = Math.max( removeNonDigit( text, decimalNum ), min );
		return max ? Math.min( result, max ) : result;
	}, []);
    const updateValueHandler = useCallback(( value ) => {
		const { onChange } = props;
		const validValue = validateInputHandler( value );

		announceCurrentValueHandler( `${ validValue }` );

		onChange( validValue );
	}, []);
    const onChangeTextHandler = useCallback(( textValue ) => {
		const { decimalNum } = props;
		const inputValue = removeNonDigit( textValue, decimalNum );

		textValue = inputValue.replace( ',', '.' );
		textValue = toFixed( textValue, decimalNum );
		const value = validateInputHandler( textValue );
		setInputValue(inputValue);
    setControlValue(value);
		updateValueHandler( value );
	}, [inputValue]);
    const onSubmitEditingHandler = useCallback(( { nativeEvent: { text } } ) => {
		const { decimalNum } = props;
		

		if ( ! isNaN( Number( text ) ) ) {
			text = toFixed( text.replace( ',', '.' ), decimalNum );
			const validValue = validateInputHandler( text );

			if ( inputValue !== validValue ) {
				setInputValue(validValue);
				announceCurrentValueHandler( `${ validValue }` );
				props.onChange( validValue );
			}
		}
	}, [inputValue]);
    const announceCurrentValueHandler = useCallback(( value ) => {
		/* translators: %s: current cell value. */
		const announcement = sprintf( __( 'Current value is %s' ), value );
		AccessibilityInfo.announceForAccessibility( announcement );
	}, []);

    const { getStylesFromColorScheme, children, label } = props;
		

		const textInputStyle = getStylesFromColorScheme(
			styles.textInput,
			styles.textInputDark
		);

		const textInputIOSStyle = getStylesFromColorScheme(
			styles.textInputIOS,
			styles.textInputIOSDark
		);

		const inputBorderStyles = [
			textInputStyle,
			borderStyles.borderStyle,
			hasFocus && borderStyles.isSelected,
		];

		const valueFinalStyle = [
			Platform.select( {
				android: inputBorderStyles,
				ios: textInputIOSStyle,
			} ),
			{
				width: 50 * fontScale,
				borderRightWidth: children ? 1 : 0,
			},
		];

		return (
			<TouchableWithoutFeedback
				onPress={ onInputFocusHandler }
				accessible={ false }
			>
				<View
					style={ [
						styles.textInputContainer,
						isIOS && inputBorderStyles,
					] }
					accessible={ false }
				>
					{ isIOS || hasFocus ? (
						<TextInput
							accessibilityLabel={ label }
							ref={ ( c ) => ( _valueTextInputHandler = c ) }
							style={ valueFinalStyle }
							onChangeText={ onChangeTextHandler }
							onSubmitEditing={ onSubmitEditingHandler }
							onFocus={ onInputFocusHandler }
							onBlur={ onInputBlurHandler }
							keyboardType="numeric"
							returnKeyType="done"
							numberOfLines={ 1 }
							defaultValue={ `${ inputValue }` }
							value={ inputValue.toString() }
							pointerEvents={ hasFocus ? 'auto' : 'none' }
						/>
					) : (
						<Text
							style={ valueFinalStyle }
							numberOfLines={ 1 }
							ellipsizeMode="clip"
						>
							{ inputValue }
						</Text>
					) }
					{ children }
				</View>
			</TouchableWithoutFeedback>
		); 
};




export default withPreferredColorScheme( RangeTextInput );
