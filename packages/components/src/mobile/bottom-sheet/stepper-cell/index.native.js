/**
 * External dependencies
 */

import { AccessibilityInfo, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from '../cell';
import Stepper from './stepper';
import styles from './style.scss';
import RangeTextInput from '../range-text-input';
import { toFixed } from '../../utils';

const STEP_DELAY = 200;
const DEFAULT_STEP = 1;

const isIOS = Platform.OS === 'ios';

const BottomSheetStepperCell = (props) => {
const { value, defaultValue, min } = props;
    const initialValue = value || defaultValue || min;

    const [inputValue, setInputValue] = useState(initialValue);
    const [stepperValue, setStepperValue] = useState(initialValue);

    useEffect(() => {
    return () => {
		clearTimeout( timeoutHandler );
		clearInterval( intervalHandler );
		clearTimeout( timeoutAnnounceValueHandler );
	};
}, []);
    const onIncrementValueHandler = useCallback(() => {
		const { step, max, onChange, value, decimalNum } = props;
		let newValue = toFixed( value + step, decimalNum );
		newValue =
			parseInt( newValue ) === newValue ? parseInt( newValue ) : newValue;
		if ( newValue <= max || max === undefined ) {
			onChange( newValue );
			setInputValue(newValue);
			announceValueHandler( newValue );
		}
	}, []);
    const onDecrementValueHandler = useCallback(() => {
		const { step, min, onChange, value, decimalNum } = props;
		let newValue = toFixed( value - step, decimalNum );
		newValue =
			parseInt( newValue ) === newValue ? parseInt( newValue ) : newValue;
		if ( newValue >= min ) {
			onChange( newValue );
			setInputValue(newValue);
			announceValueHandler( newValue );
		}
	}, []);
    const onIncrementValuePressInHandler = useCallback(() => {
		onIncrementValueHandler();
		timeoutHandler = setTimeout( () => {
			startPressIntervalHandler( onIncrementValueHandler );
		}, 500 );
	}, []);
    const onDecrementValuePressInHandler = useCallback(() => {
		onDecrementValueHandler();
		timeoutHandler = setTimeout( () => {
			startPressIntervalHandler( onDecrementValueHandler );
		}, 500 );
	}, []);
    const onPressOutHandler = useCallback(() => {
		clearTimeout( timeoutHandler );
		clearInterval( intervalHandler );
	}, []);
    const startPressIntervalHandler = useCallback(( callback, speed = STEP_DELAY ) => {
		let counter = 0;
		intervalHandler = setInterval( () => {
			callback();
			counter += 1;

			if ( counter === 10 ) {
				clearInterval( intervalHandler );
				startPressIntervalHandler( callback, speed / 2 );
			}
		}, speed );
	}, []);
    const announceValueHandler = useCallback(( value ) => {
		const { label, unitLabel = '' } = props;

		if ( isIOS ) {
			// On Android it triggers the accessibilityLabel with the value change
			clearTimeout( timeoutAnnounceValueHandler );
			timeoutAnnounceValueHandler = setTimeout( () => {
				AccessibilityInfo.announceForAccessibility(
					`${ value } ${ unitLabel } ${ label }`
				);
			}, 300 );
		}
	}, []);

    const {
			label,
			settingLabel = 'Value',
			unitLabel = '',
			icon,
			min,
			max,
			value,
			separatorType,
			children,
			shouldDisplayTextInput = false,
			preview,
			onChange,
			openUnitPicker,
			decimalNum,
			cellContainerStyle,
		} = props;
		
		const isMinValue = value === min;
		const isMaxValue = value === max;
		const labelStyle = [
			styles.cellLabel,
			! icon ? styles.cellLabelNoIcon : {},
		];

		const getAccessibilityHint = () => {
			return openUnitPicker ? __( 'double-tap to change unit' ) : '';
		};

		const accessibilityLabel = sprintf(
			/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: setting label (example: width), %3$s: Current value. %4$s: value measurement unit (example: pixels) */
			__( '%1$s. %2$s is %3$s %4$s.' ),
			label,
			settingLabel,
			value,
			unitLabel
		);

		const containerStyle = [
			styles.rowContainer,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<View
				accessible={ true }
				accessibilityRole="adjustable"
				accessibilityLabel={ accessibilityLabel }
				accessibilityHint={ getAccessibilityHint() }
				accessibilityActions={ [
					{ name: 'increment' },
					{ name: 'decrement' },
					{ name: 'activate' },
				] }
				onAccessibilityAction={ ( event ) => {
					switch ( event.nativeEvent.actionName ) {
						case 'increment':
							onIncrementValueHandler();
							break;
						case 'decrement':
							onDecrementValueHandler();
							break;
						case 'activate':
							if ( openUnitPicker ) {
								openUnitPicker();
							}
							break;
					}
				} }
			>
				<View importantForAccessibility="no-hide-descendants">
					<Cell
						accessible={ false }
						cellContainerStyle={ [
							styles.cellContainerStyle,
							preview && styles.columnContainer,
							cellContainerStyle,
						] }
						cellRowContainerStyle={
							preview ? containerStyle : styles.cellRowStyles
						}
						editable={ false }
						icon={ icon }
						label={ label }
						labelStyle={ labelStyle }
						leftAlign={ true }
						separatorType={ separatorType }
					>
						<View style={ preview && containerStyle }>
							{ preview }
							<Stepper
								isMaxValue={ isMaxValue }
								isMinValue={ isMinValue }
								onPressInDecrement={
									onDecrementValuePressInHandler
								}
								onPressInIncrement={
									onIncrementValuePressInHandler
								}
								onPressOut={ onPressOutHandler }
								value={ value }
								shouldDisplayTextInput={
									shouldDisplayTextInput
								}
							>
								{ shouldDisplayTextInput && (
									<RangeTextInput
										label={ label }
										onChange={ onChange }
										defaultValue={ `${ inputValue }` }
										value={ value }
										min={ min }
										step={ 1 }
										decimalNum={ decimalNum }
									>
										{ children }
									</RangeTextInput>
								) }
							</Stepper>
						</View>
					</Cell>
				</View>
			</View>
		); 
};




BottomSheetStepperCell.defaultProps = {
	step: DEFAULT_STEP,
};

export default withPreferredColorScheme( BottomSheetStepperCell );
