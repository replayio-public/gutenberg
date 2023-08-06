/**
 * External dependencies
 */

import { Platform, AccessibilityInfo, View } from 'react-native';
import Slider from '@react-native-community/slider';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import styles from './range-cell.scss';
import RangeTextInput from './range-text-input';
import { toFixed } from '../utils';

const isIOS = Platform.OS === 'ios';

const BottomSheetRangeCell = (props) => {
const { value, defaultValue, minimumValue } = props;
    const initialValue = Number( value || defaultValue || minimumValue );

    const [inputValue, setInputValue] = useState(initialValue);
    const [sliderValue, setSliderValue] = useState(initialValue);

    useEffect(() => {
    return () => {
		clearTimeout( timeoutAnnounceValueHandler );
	};
}, []);
    const onSliderChangeHandler = useCallback(( initialValue ) => {
		const { decimalNum, onChange } = props;
		initialValue = toFixed( initialValue, decimalNum );
		setInputValue(initialValue);
		onChange( initialValue );
	}, []);
    const onTextInputChangeHandler = useCallback(( nextValue ) => {
		const { onChange, onComplete } = props;
		setSliderValue(nextValue);
		onChange( nextValue );
		if ( onComplete ) {
			onComplete( nextValue );
		}
	}, []);
    const onCompleteSliderChangeHandler = useCallback(( nextValue ) => {
		const { decimalNum, onComplete } = props;
		nextValue = toFixed( nextValue, decimalNum );
		if ( onComplete ) {
			onComplete( nextValue );
		}
	}, []);
    /*
	 * Only used with screenreaders like VoiceOver and TalkBack. Increments the
	 * value of this setting programmatically.
	 */
    const a11yIncrementValueHandler = useCallback(() => {
		const { step = 5, maximumValue, decimalNum } = props;
		

		const newValue = toFixed( inputValue + step, decimalNum );

		if ( newValue <= maximumValue || maximumValue === undefined ) {
			a11yUpdateValueHandler( newValue );
		}
	}, [inputValue]);
    /*
	 * Only used with screenreaders like VoiceOver and TalkBack. Decrements the
	 * value of this setting programmatically.
	 */
    const a11yDecrementValueHandler = useCallback(() => {
		const { step = 5, minimumValue, decimalNum } = props;
		

		const newValue = toFixed( sliderValue - step, decimalNum );

		if ( newValue >= minimumValue ) {
			a11yUpdateValueHandler( newValue );
		}
	}, [sliderValue]);
    const a11yUpdateValueHandler = useCallback(( newValue ) => {
		const { onChange, onComplete } = props;
		setSliderValue(newValue);
    setInputValue(newValue);
		onChange( newValue );
		if ( onComplete ) {
			onComplete( newValue );
		}
		announceValueHandler( newValue );
	}, []);
    /*
	 * Only used with screenreaders like VoiceOver and TalkBack.
	 */
    const announceValueHandler = useCallback(( value ) => {
		const { label, unitLabel = '' } = props;

		if ( isIOS ) {
			// On Android it triggers the accessibilityLabel with the value change, but
			// on iOS we need to do this manually.
			clearTimeout( timeoutAnnounceValueHandler );
			timeoutAnnounceValueHandler = setTimeout( () => {
				AccessibilityInfo.announceForAccessibility(
					`${ value } ${ unitLabel },  ${ label }`
				);
			}, 300 );
		}
	}, []);

    const {
			value,
			defaultValue,
			minimumValue = 0,
			maximumValue = 10,
			disabled,
			step = 1,
			preferredColorScheme,
			minimumTrackTintColor = preferredColorScheme === 'light'
				? '#00669b'
				: '#5198d9',
			maximumTrackTintColor = isIOS ? '#e9eff3' : '#909090',
			thumbTintColor = ! isIOS && '#00669b',
			preview,
			cellContainerStyle,
			shouldDisplayTextInput = true,
			unitLabel = '',
			settingLabel = 'Value',
			openUnitPicker,
			children,
			decimalNum,
			...cellProps
		} = props;

		

		const getAccessibilityHint = () => {
			return openUnitPicker ? __( 'double-tap to change unit' ) : '';
		};

		const getAccessibilityLabel = () => {
			return sprintf(
				/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: setting label (example: width), %3$s: Current value. %4$s: value measurement unit (example: pixels) */
				__( '%1$s. %2$s is %3$s %4$s.' ),
				cellProps.label,
				settingLabel,
				toFixed( value, decimalNum ),
				unitLabel
			);
		};

		const containerStyle = [
			styles.container,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<View
				accessible={ true }
				accessibilityRole="adjustable"
				accessibilityActions={ [
					{ name: 'increment' },
					{ name: 'decrement' },
					{ name: 'activate' },
				] }
				onAccessibilityAction={ ( event ) => {
					switch ( event.nativeEvent.actionName ) {
						case 'increment':
							a11yIncrementValueHandler();
							break;
						case 'decrement':
							a11yDecrementValueHandler();
							break;
						case 'activate':
							if ( openUnitPicker ) {
								openUnitPicker();
							}
							break;
					}
				} }
				accessibilityLabel={ getAccessibilityLabel() }
				accessibilityHint={ getAccessibilityHint() }
			>
				<View importantForAccessibility="no-hide-descendants">
					<Cell
						{ ...cellProps }
						cellContainerStyle={ [
							styles.cellContainerStyles,
							cellContainerStyle,
						] }
						cellRowContainerStyle={ containerStyle }
						leftAlign
						editable={ false }
						activeOpacity={ 1 }
						accessible={ false }
						valueStyle={ styles.valueStyle }
					>
						<View style={ containerStyle }>
							{ preview }
							<Slider
								testID={ `Slider ${ cellProps.label }` }
								value={ sliderValue }
								defaultValue={ defaultValue }
								disabled={ disabled }
								step={ step }
								minimumValue={ minimumValue }
								maximumValue={ maximumValue }
								minimumTrackTintColor={ minimumTrackTintColor }
								maximumTrackTintColor={ maximumTrackTintColor }
								thumbTintColor={ thumbTintColor }
								onValueChange={ onSliderChangeHandler }
								onSlidingComplete={
									onCompleteSliderChangeHandler
								}
								ref={ ( slider ) => {
									sliderRefHandler = slider;
								} }
								style={
									isIOS
										? styles.sliderIOS
										: styles.sliderAndroid
								}
							/>
							{ shouldDisplayTextInput && (
								<RangeTextInput
									label={ cellProps.label }
									onChange={ onTextInputChangeHandler }
									defaultValue={ `${ inputValue }` }
									value={ inputValue }
									min={ minimumValue }
									max={ maximumValue }
									step={ step }
									decimalNum={ decimalNum }
								>
									{ children }
								</RangeTextInput>
							) }
						</View>
					</Cell>
				</View>
			</View>
		); 
};




export default withPreferredColorScheme( BottomSheetRangeCell );
