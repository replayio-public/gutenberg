/**
 * External dependencies
 */

import {
    Dimensions,
    Keyboard,
    LayoutAnimation,
    PanResponder,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableHighlight,
    View,
} from 'react-native';
import Modal from 'react-native-modal';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { subscribeAndroidModalClosed } from '@wordpress/react-native-bridge';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Button from './button';
import Cell from './cell';
import CyclePickerCell from './cycle-picker-cell';
import PickerCell from './picker-cell';
import SwitchCell from './switch-cell';
import RangeCell from './range-cell';
import ColorCell from './color-cell';
import LinkCell from './link-cell';
import LinkSuggestionItemCell from './link-suggestion-item-cell';
import RadioCell from './radio-cell';
import NavigationScreen from './bottom-sheet-navigation/navigation-screen';
import NavigationContainer from './bottom-sheet-navigation/navigation-container';
import KeyboardAvoidingView from './keyboard-avoiding-view';
import BottomSheetSubSheet from './sub-sheet';
import NavBar from './nav-bar';
import { BottomSheetProvider } from './bottom-sheet-context';

const DEFAULT_LAYOUT_ANIMATION = LayoutAnimation.Presets.easeInEaseOut;

const BottomSheet = (props) => {


    const [safeAreaBottomInset, setSafeAreaBottomInset] = useState(0);
    const [safeAreaTopInset, setSafeAreaTopInset] = useState(0);
    const [bounces, setBounces] = useState(false);
    const [maxHeight, setMaxHeight] = useState(0);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [isScrolling, setIsScrolling] = useState(false);
    const [handleClosingBottomSheet, setHandleClosingBottomSheet] = useState(null);
    const [handleHardwareButtonPress, setHandleHardwareButtonPress] = useState(null);
    const [isMaxHeightSet, setIsMaxHeightSet] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(props.isFullScreen || false);

    const keyboardShowHandler = useCallback(( e ) => {
		if ( ! props.isVisible ) {
			return;
		}

		const { height } = e.endCoordinates;
		keyboardHeightHandler = height;
		performKeyboardLayoutAnimationHandler( e );
		onSetMaxHeight();
		props.onKeyboardShow?.();
	}, []);
    const keyboardHideHandler = useCallback(( e ) => {
		if ( ! props.isVisible ) {
			return;
		}

		keyboardHeightHandler = 0;
		performKeyboardLayoutAnimationHandler( e );
		onSetMaxHeight();
		props.onKeyboardHide?.();
	}, []);
    const performKeyboardLayoutAnimationHandler = useCallback(( event ) => {
		const { duration, easing } = event;

		if ( duration && easing ) {
			// This layout animation is the same as the React Native's KeyboardAvoidingView component.
			// Reference: https://github.com/facebook/react-native/blob/266b21baf35e052ff28120f79c06c4f6dddc51a9/Libraries/Components/Keyboard/KeyboardAvoidingView.js#L119-L128.
			const animationConfig = {
				// We have to pass the duration equal to minimal accepted duration defined here: RCTLayoutAnimation.m.
				duration: duration > 10 ? duration : 10,
				type: LayoutAnimation.Types[ easing ] || 'keyboard',
			};
			const layoutAnimation = {
				duration: animationConfig.duration,
				update: animationConfig,
				create: {
					...animationConfig,
					property: LayoutAnimation.Properties.opacity,
				},
				delete: {
					...animationConfig,
					property: LayoutAnimation.Properties.opacity,
				},
			};
			lastLayoutAnimationFinishedHandler = false;
			LayoutAnimation.configureNext( layoutAnimation, () => {
				lastLayoutAnimationFinishedHandler = true;
			} );
			lastLayoutAnimationHandler = layoutAnimation;
		} else {
			// TODO: Reinstate animations, possibly replacing `LayoutAnimation` with
			// more nuanced `Animated` usage or replacing our custom `BottomSheet`
			// with `@gorhom/bottom-sheet`. This animation was disabled to avoid a
			// preexisting bug: https://github.com/WordPress/gutenberg/issues/30562
			// this.performRegularLayoutAnimation( {
			// 	useLastLayoutAnimation: false,
			// } );.
		}
	}, []);
    const performRegularLayoutAnimationHandler = useCallback(( { useLastLayoutAnimation } ) => {
		// On Android, we should prevent triggering multiple layout animations at the same time because it can produce visual glitches.
		if (
			Platform.OS === 'android' &&
			lastLayoutAnimationHandler &&
			! lastLayoutAnimationFinishedHandler
		) {
			return;
		}

		const layoutAnimation = useLastLayoutAnimation
			? lastLayoutAnimationHandler || DEFAULT_LAYOUT_ANIMATION
			: DEFAULT_LAYOUT_ANIMATION;

		lastLayoutAnimationFinishedHandler = false;
		LayoutAnimation.configureNext( layoutAnimation, () => {
			lastLayoutAnimationFinishedHandler = true;
		} );
		lastLayoutAnimationHandler = layoutAnimation;
	}, []);
    useEffect(() => {
		SafeArea.getSafeAreaInsetsForRootView().then(
			onSafeAreaInsetsUpdateHandler
		);

		if ( Platform.OS === 'android' ) {
			androidModalClosedSubscriptionHandler = subscribeAndroidModalClosed(
				() => {
					props.onClose();
				}
			);
		}

		dimensionsChangeSubscriptionHandler = Dimensions.addEventListener(
			'change',
			onDimensionsChangeHandler
		);

		// 'Will' keyboard events are not available on Android.
		// Reference: https://reactnative.dev/docs/0.61/keyboard#addlistener.
		keyboardShowListenerHandler = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			keyboardShowHandler
		);
		keyboardHideListenerHandler = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			keyboardHideHandler
		);

		safeAreaEventSubscriptionHandler = SafeArea.addEventListener(
			'safeAreaInsetsForRootViewDidChange',
			onSafeAreaInsetsUpdateHandler
		);
		onSetMaxHeight();
	}, []);
    useEffect(() => {
    return () => {
		dimensionsChangeSubscriptionHandler.remove();
		keyboardShowListenerHandler.remove();
		keyboardHideListenerHandler.remove();
		if ( androidModalClosedSubscriptionHandler ) {
			androidModalClosedSubscriptionHandler.remove();
		}
		if ( safeAreaEventSubscriptionHandler === null ) {
			return;
		}
		safeAreaEventSubscriptionHandler.remove();
		safeAreaEventSubscriptionHandler = null;
	};
}, []);
    const onSafeAreaInsetsUpdateHandler = useCallback(( result ) => {
		
		if ( safeAreaEventSubscriptionHandler === null ) {
			return;
		}
		const { safeAreaInsets } = result;
		if (
			safeAreaBottomInset !== safeAreaInsets.bottom ||
			safeAreaTopInset !== safeAreaInsets.top
		) {
			setSafeAreaBottomInset(safeAreaInsets.bottom);
    setSafeAreaTopInset(safeAreaInsets.top);
		}
	}, [safeAreaBottomInset, safeAreaTopInset]);
    const onSetMaxHeight = useMemo(() => {
		const { height, width } = Dimensions.get( 'window' );
		
		const statusBarHeight =
			Platform.OS === 'android' ? StatusBar.currentHeight : 0;

		// `maxHeight` when modal is opened along with a keyboard.
		const maxHeightWithOpenKeyboard =
			0.95 *
			( Dimensions.get( 'window' ).height -
				keyboardHeightHandler -
				statusBarHeight -
				headerHeightHandler );

		// In landscape orientation, set `maxHeight` to ~96% of the height.
		if ( width > height ) {
			setMaxHeight(Math.min(
					0.96 * height - headerHeightHandler,
					maxHeightWithOpenKeyboard
				));
			// In portrait orientation, set `maxHeight` to ~59% of the height.
		} else {
			setMaxHeight(Math.min(
					height * 0.59 - safeAreaBottomInset - headerHeightHandler,
					maxHeightWithOpenKeyboard
				));
		}
	}, [safeAreaBottomInset]);
    const onDimensionsChangeHandler = useCallback(() => {
		onSetMaxHeight();
		setBounces(false);
	}, []);
    const onHeaderLayoutHandler = useCallback(( { nativeEvent } ) => {
		const { height } = nativeEvent.layout;
		// The layout animation should only be triggered if the header
		// height has changed after being mounted.
		if (
			headerHeightHandler !== 0 &&
			Math.round( height ) !== Math.round( headerHeightHandler )
		) {
			performRegularLayoutAnimationHandler( {
				useLastLayoutAnimation: true,
			} );
		}
		headerHeightHandler = height;
		onSetMaxHeight();
	}, []);
    const isCloseToBottomHandler = useCallback(( { layoutMeasurement, contentOffset, contentSize } ) => {
		return (
			layoutMeasurement.height + contentOffset.y >=
			contentSize.height - contentOffset.y
		);
	}, []);
    const isCloseToTopHandler = useCallback(( { contentOffset } ) => {
		return contentOffset.y < 10;
	}, []);
    const onScrollHandler = useCallback(( { nativeEvent } ) => {
		if ( isCloseToTopHandler( nativeEvent ) ) {
			setBounces(false);
		} else {
			setBounces(true);
		}
	}, []);
    const onDismissHandler = useCallback(() => {
		const { onDismiss } = props;

		if ( onDismiss ) {
			onDismiss();
		}

		onCloseBottomSheetHandler();
	}, []);
    const onShouldEnableScrollHandler = useCallback(( value ) => {
		setScrollEnabled(value);
	}, []);
    const onShouldSetBottomSheetMaxHeightHandler = useCallback(( value ) => {
		setIsMaxHeightSet(value);
	}, []);
    const isScrollingHandler = useCallback(( value ) => {
		setIsScrolling(value);
	}, []);
    const onHandleClosingBottomSheetHandler = useCallback(( action ) => {
		setHandleClosingBottomSheet(action);
	}, []);
    const onHandleHardwareButtonPressHandler = useCallback(( action ) => {
		setHandleHardwareButtonPress(action);
	}, []);
    const onCloseBottomSheetHandler = useCallback(() => {
		const { onClose } = props;
		
		if ( handleClosingBottomSheet ) {
			handleClosingBottomSheet();
			onHandleClosingBottomSheetHandler( null );
		}
		if ( onClose ) {
			onClose();
		}
		onShouldSetBottomSheetMaxHeightHandler( true );
	}, [handleClosingBottomSheet]);
    const setIsFullScreenHandler = useCallback(( isFullScreen ) => {
		if ( isFullScreen !== isFullScreen ) {
			if ( isFullScreen ) {
				setIsFullScreen(isFullScreen);
    setIsMaxHeightSet(false);
			} else {
				setIsFullScreen(isFullScreen);
    setIsMaxHeightSet(true);
			}
		}
	}, [isFullScreen]);
    const onHardwareButtonPressHandler = useCallback(() => {
		const { onClose } = props;
		
		if ( handleHardwareButtonPress && handleHardwareButtonPress() ) {
			return;
		}
		if ( onClose ) {
			return onClose();
		}
	}, [handleHardwareButtonPress]);
    const getContentStyleHandler = useCallback(() => {
		
		return {
			paddingBottom:
				( safeAreaBottomInset || 0 ) +
				styles.scrollableContent.paddingBottom,
		};
	}, [safeAreaBottomInset]);

    const {
			title = '',
			isVisible,
			leftButton,
			rightButton,
			header,
			hideHeader,
			style = {},
			contentStyle = {},
			getStylesFromColorScheme,
			children,
			withHeaderSeparator = false,
			hasNavigation,
			onDismiss,
			...rest
		} = props;
		

		const panResponder = PanResponder.create( {
			onMoveShouldSetPanResponder: ( evt, gestureState ) => {
				// 'swiping-to-close' option is temporarily and partially disabled
				// on Android ( swipe / drag is still available in the top most area - near drag indicator).
				if ( Platform.OS === 'ios' ) {
					// Activates swipe down over child Touchables if the swipe is long enough.
					// With this we can adjust sensibility on the swipe vs tap gestures.
					if ( gestureState.dy > 3 && ! bounces ) {
						gestureState.dy = 0;
						return true;
					}
				}
				return false;
			},
		} );

		const backgroundStyle = getStylesFromColorScheme(
			styles.background,
			styles.backgroundDark
		);

		const bottomSheetHeaderTitleStyle = getStylesFromColorScheme(
			styles.bottomSheetHeaderTitle,
			styles.bottomSheetHeaderTitleDark
		);

		let listStyle = {};
		if ( isFullScreen ) {
			listStyle = { flexGrow: 1, flexShrink: 1 };
		} else if ( isMaxHeightSet ) {
			listStyle = { maxHeight };

			// Allow setting a "static" height of the bottom sheet
			// by setting the min height to the max height.
			if ( props.setMinHeightToMaxHeight ) {
				listStyle.minHeight = maxHeight;
			}
		}

		const listProps = {
			disableScrollViewPanResponder: true,
			bounces,
			onScroll: onScrollHandler,
			onScrollBeginDrag: onScrollBeginDragHandler,
			onScrollEndDrag: onScrollEndDragHandler,
			scrollEventThrottle: 16,
			contentContainerStyle: [
				styles.content,
				hideHeader && styles.emptyHeader,
				contentStyle,
				isFullScreen && { flexGrow: 1 },
			],
			style: listStyle,
			safeAreaBottomInset,
			scrollEnabled,
			automaticallyAdjustContentInsets: false,
		};

		const WrapperView = hasNavigation ? View : ScrollView;

		const getHeader = () => (
			<>
				{ header || (
					<View style={ styles.bottomSheetHeader }>
						<View style={ styles.flex }>{ leftButton }</View>
						<Text
							style={ bottomSheetHeaderTitleStyle }
							maxFontSizeMultiplier={ 3 }
						>
							{ title }
						</Text>
						<View style={ styles.flex }>{ rightButton }</View>
					</View>
				) }
				{ withHeaderSeparator && <View style={ styles.separator } /> }
			</>
		);

		const showDragIndicator = () => {
			// If iOS or not fullscreen show the drag indicator.
			if ( Platform.OS === 'ios' || ! isFullScreen ) {
				return true;
			}

			// Otherwise check the allowDragIndicator.
			return props.allowDragIndicator;
		};

		return (
			<Modal
				isVisible={ isVisible }
				style={ styles.bottomModal }
				animationInTiming={ 400 }
				animationOutTiming={ 300 }
				backdropTransitionInTiming={ 50 }
				backdropTransitionOutTiming={ 50 }
				backdropOpacity={ 0.2 }
				onBackdropPress={ onCloseBottomSheetHandler }
				onBackButtonPress={ onHardwareButtonPressHandler }
				onSwipeComplete={ onCloseBottomSheetHandler }
				onDismiss={ Platform.OS === 'ios' ? onDismissHandler : undefined }
				onModalHide={
					Platform.OS === 'android' ? onDismissHandler : undefined
				}
				swipeDirection="down"
				onMoveShouldSetResponder={
					scrollEnabled &&
					panResponder.panHandlers.onMoveShouldSetResponder
				}
				onMoveShouldSetResponderCapture={
					scrollEnabled &&
					panResponder.panHandlers.onMoveShouldSetResponderCapture
				}
				onAccessibilityEscape={ onCloseBottomSheetHandler }
				{ ...rest }
			>
				<KeyboardAvoidingView
					behavior={ Platform.OS === 'ios' && 'padding' }
					style={ {
						...backgroundStyle,
						borderColor: 'rgba(0, 0, 0, 0.1)',
						marginTop:
							Platform.OS === 'ios' && isFullScreen
								? safeAreaTopInset
								: 0,
						flex: isFullScreen ? 1 : undefined,
						...( Platform.OS === 'android' && isFullScreen
							? styles.backgroundFullScreen
							: {} ),
						...style,
					} }
					keyboardVerticalOffset={ -safeAreaBottomInset }
				>
					<View
						style={ styles.header }
						onLayout={ onHeaderLayoutHandler }
						testID={ `${ rest.testID || 'bottom-sheet' }-header` }
					>
						{ showDragIndicator() && (
							<View style={ styles.dragIndicator } />
						) }
						{ ! hideHeader && getHeader() }
					</View>
					<WrapperView
						{ ...( hasNavigation
							? { style: listProps.style }
							: listProps ) }
					>
						<BottomSheetProvider
							value={ {
								shouldEnableBottomSheetScroll:
									onShouldEnableScrollHandler,
								shouldEnableBottomSheetMaxHeight:
									onShouldSetBottomSheetMaxHeightHandler,
								isBottomSheetContentScrolling: isScrolling,
								onHandleClosingBottomSheet:
									onHandleClosingBottomSheetHandler,
								onHandleHardwareButtonPress:
									onHandleHardwareButtonPressHandler,
								listProps,
								setIsFullScreen: setIsFullScreenHandler,
								safeAreaBottomInset,
							} }
						>
							{ hasNavigation ? (
								<>{ children }</>
							) : (
								<TouchableHighlight accessible={ false }>
									<>{ children }</>
								</TouchableHighlight>
							) }
						</BottomSheetProvider>
						{ ! hasNavigation && (
							<View
								style={ {
									height:
										safeAreaBottomInset ||
										styles.scrollableContent.paddingBottom,
								} }
							/>
						) }
					</WrapperView>
				</KeyboardAvoidingView>
			</Modal>
		); 
};




function getWidth() {
	return Math.min(
		Dimensions.get( 'window' ).width,
		styles.background.maxWidth
	);
}

const ThemedBottomSheet = withPreferredColorScheme( BottomSheet );

ThemedBottomSheet.getWidth = getWidth;
ThemedBottomSheet.Button = Button;
ThemedBottomSheet.Cell = Cell;
ThemedBottomSheet.SubSheet = BottomSheetSubSheet;
ThemedBottomSheet.NavBar = NavBar;
ThemedBottomSheet.CyclePickerCell = CyclePickerCell;
ThemedBottomSheet.PickerCell = PickerCell;
ThemedBottomSheet.SwitchCell = SwitchCell;
ThemedBottomSheet.RangeCell = RangeCell;
ThemedBottomSheet.ColorCell = ColorCell;
ThemedBottomSheet.LinkCell = LinkCell;
ThemedBottomSheet.LinkSuggestionItemCell = LinkSuggestionItemCell;
ThemedBottomSheet.RadioCell = RadioCell;
ThemedBottomSheet.NavigationScreen = NavigationScreen;
ThemedBottomSheet.NavigationContainer = NavigationContainer;

export default ThemedBottomSheet;
