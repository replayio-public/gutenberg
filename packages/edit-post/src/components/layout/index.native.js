/**
 * External dependencies
 */

import { Platform, SafeAreaView, View } from 'react-native';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import {
    BottomSheetSettings,
    FloatingToolbar,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
    HTMLTextInput,
    KeyboardAvoidingView,
    NoticeList,
    Tooltip,
    __unstableAutocompletionItemsSlot as AutocompletionItemsSlot,
} from '@wordpress/components';
import { AutosaveMonitor, store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import headerToolbarStyles from '../header/header-toolbar/style.scss';
import Header from '../header';
import { store as editPostStore } from '../../store';

const Layout = (props) => {


    const [rootViewHeight, setRootViewHeight] = useState(0);
    const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, right: 0, left: 0 });

    useEffect(() => {
		_isMountedHandler = true;
		safeAreaSubscriptionHandler = SafeArea.addEventListener(
			'safeAreaInsetsForRootViewDidChange',
			onSafeAreaInsetsUpdateHandler
		);
	}, []);
    useEffect(() => {
    return () => {
		safeAreaSubscriptionHandler?.remove();
		_isMountedHandler = false;
	};
}, []);
    const onSafeAreaInsetsUpdateHandler = useCallback(( result ) => {
		const { safeAreaInsets } = result;
		if ( _isMountedHandler ) {
			setSafeAreaInsets(safeAreaInsets);
		}
	}, [safeAreaInsets]);
    const onRootViewLayoutHandler = useCallback(( event ) => {
		if ( _isMountedHandler ) {
			setHeightStateHandler( event );
		}
	}, []);
    const setHeightStateHandler = useCallback(( event ) => {
		const { height } = event.nativeEvent.layout;
		if ( height !== rootViewHeight ) {
			setRootViewHeight(height);
		}
	}, [rootViewHeight]);
    const renderHTMLHandler = useCallback(() => {
		const { globalStyles } = props;
		return (
			<HTMLTextInput
				parentHeight={ rootViewHeight }
				style={ globalStyles }
			/>
		);
	}, [rootViewHeight]);
    const renderVisualHandler = useCallback(() => {
		const { isReady } = props;

		if ( ! isReady ) {
			return null;
		}

		return <VisualEditor setTitleRef={ props.setTitleRef } />;
	}, []);

    const { getStylesFromColorScheme, mode, globalStyles } = props;

		const isHtmlView = mode === 'text';

		// Add a margin view at the bottom for the header.
		const marginBottom =
			Platform.OS === 'android' && ! isHtmlView
				? headerToolbarStyles[ 'header-toolbar__container' ].height
				: 0;

		const containerStyles = getStylesFromColorScheme(
			styles.container,
			styles.containerDark
		);

		const toolbarKeyboardAvoidingViewStyle = {
			...styles.toolbarKeyboardAvoidingView,
			left: safeAreaInsets.left,
			right: safeAreaInsets.right,
			bottom: safeAreaInsets.bottom,
			backgroundColor: containerStyles.backgroundColor,
		};

		const editorStyles = [
			getStylesFromColorScheme(
				styles.background,
				styles.backgroundDark
			),
			globalStyles?.background && {
				backgroundColor: globalStyles.background,
			},
		];

		return (
			<Tooltip.Slot>
				<SafeAreaView
					style={ containerStyles }
					onLayout={ onRootViewLayoutHandler }
				>
					<AutosaveMonitor disableIntervalChecks />
					<View style={ editorStyles }>
						{ isHtmlView ? renderHTMLHandler() : renderVisualHandler() }
						{ ! isHtmlView && Platform.OS === 'android' && (
							<FloatingToolbar />
						) }
						<NoticeList />
					</View>
					<View
						style={ {
							flex: 0,
							flexBasis: marginBottom,
							height: marginBottom,
						} }
					/>
					{ ! isHtmlView && (
						<KeyboardAvoidingView
							parentHeight={ rootViewHeight }
							style={ toolbarKeyboardAvoidingViewStyle }
							withAnimatedHeight
						>
							{ Platform.OS === 'ios' && (
								<>
									<AutocompletionItemsSlot />
									<FloatingToolbar />
								</>
							) }
							<Header />
							<BottomSheetSettings />
						</KeyboardAvoidingView>
					) }
					{ Platform.OS === 'android' && <AutocompletionItemsSlot /> }
				</SafeAreaView>
			</Tooltip.Slot>
		); 
};




export default compose( [
	withSelect( ( select ) => {
		const { __unstableIsEditorReady: isEditorReady } =
			select( editorStore );
		const { getEditorMode } = select( editPostStore );
		const { getSettings } = select( blockEditorStore );
		const globalStyles =
			getSettings()?.__experimentalGlobalStylesBaseStyles?.color;

		return {
			isReady: isEditorReady(),
			mode: getEditorMode(),
			globalStyles,
		};
	} ),
	withPreferredColorScheme,
] )( Layout );
