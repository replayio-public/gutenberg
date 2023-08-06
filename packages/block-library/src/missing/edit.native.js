/**
 * External dependencies
 */

import {
    View,
    Text,
    TouchableWithoutFeedback,
    TouchableHighlight,
} from 'react-native';

/**
 * WordPress dependencies
 */
import {
    requestUnsupportedBlockFallback,
    sendActionButtonPressedAction,
    actionButtons,
} from '@wordpress/react-native-bridge';
import { BottomSheet, Icon, TextControl } from '@wordpress/components';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { coreBlocks } from '@wordpress/block-library';
import { normalizeIconObject } from '@wordpress/blocks';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { help, plugins } from '@wordpress/icons';
import { withSelect, withDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

// Blocks that can't be edited through the Unsupported block editor identified by their name.
const UBE_INCOMPATIBLE_BLOCKS = [ 'core/block' ];
const I18N_BLOCK_SCHEMA_TITLE = 'block title';

export export const UnsupportedBlockEdit = (props) => {


    const [showHelp, setShowHelp] = useState(false);

    const toggleSheetHandler = useCallback(() => {
		setShowHelp(! showHelp);
	}, [showHelp]);
    const closeSheetHandler = useCallback(() => {
		setShowHelp(false);
	}, []);
    useEffect(() => {
    return () => {
		if ( timeoutHandler ) {
			clearTimeout( timeoutHandler );
		}
	};
}, []);
    const getTitleHandler = useCallback(() => {
		const { originalName } = props.attributes;
		const blockType = coreBlocks[ originalName ];
		const title = blockType?.metadata.title;
		const textdomain = blockType?.metadata.textdomain;

		return title && textdomain
			? // eslint-disable-next-line @wordpress/i18n-no-variables, @wordpress/i18n-text-domain
			  _x( title, I18N_BLOCK_SCHEMA_TITLE, textdomain )
			: originalName;
	}, []);
    const renderHelpIconHandler = useCallback(() => {
		const infoIconStyle = props.getStylesFromColorScheme(
			styles.infoIcon,
			styles.infoIconDark
		);

		return (
			<TouchableHighlight
				onPress={ onHelpButtonPressedHandler }
				style={ styles.helpIconContainer }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
			>
				<Icon
					className="unsupported-icon-help"
					label={ __( 'Help icon' ) }
					icon={ help }
					color={ infoIconStyle.color }
				/>
			</TouchableHighlight>
		);
	}, []);
    const onHelpButtonPressedHandler = useCallback(() => {
		if ( ! props.isSelected ) {
			props.selectBlock();
		}
		toggleSheetHandler();
	}, []);
    const requestFallbackHandler = useCallback(() => {
		if (
			props.canEnableUnsupportedBlockEditor &&
			props.isUnsupportedBlockEditorSupported === false
		) {
			toggleSheetHandler();
			setSendButtonPressMessage(true);
		} else {
			toggleSheetHandler();
			setSendFallbackMessage(true);
		}
	}, []);
    const renderSheetHandler = useCallback(( blockTitle, blockName ) => {
		const {
			getStylesFromColorScheme,
			attributes,
			clientId,
			isUnsupportedBlockEditorSupported,
			canEnableUnsupportedBlockEditor,
			isEditableInUnsupportedBlockEditor,
		} = props;
		const infoTextStyle = getStylesFromColorScheme(
			styles.infoText,
			styles.infoTextDark
		);
		const infoTitleStyle = getStylesFromColorScheme(
			styles.infoTitle,
			styles.infoTitleDark
		);
		const infoDescriptionStyle = getStylesFromColorScheme(
			styles.infoDescription,
			styles.infoDescriptionDark
		);
		const infoSheetIconStyle = getStylesFromColorScheme(
			styles.infoSheetIcon,
			styles.infoSheetIconDark
		);

		/* translators: Missing block alert title. %s: The localized block name */
		const titleFormat = __( "'%s' is not fully-supported" );
		const infoTitle = sprintf( titleFormat, blockTitle );
		const missingBlockDetail = applyFilters(
			'native.missing_block_detail',
			__( 'We are working hard to add more blocks with each release.' )
		);
		const missingBlockActionButton = applyFilters(
			'native.missing_block_action_button',
			__( 'Edit using web editor' )
		);

		const actionButtonStyle = getStylesFromColorScheme(
			styles.actionButton,
			styles.actionButtonDark
		);

		return (
			<BottomSheet
				isVisible={ showHelp }
				hideHeader
				onClose={ closeSheetHandler }
				onModalHide={ () => {
					if ( sendFallbackMessage ) {
						// On iOS, onModalHide is called when the controller is still part of the hierarchy.
						// A small delay will ensure that the controller has already been removed.
						timeoutHandler = setTimeout( () => {
							// For the Classic block, the content is kept in the `content` attribute.
							const content =
								blockName === 'core/freeform'
									? attributes.content
									: attributes.originalContent;
							requestUnsupportedBlockFallback(
								content,
								clientId,
								blockName,
								blockTitle
							);
						}, 100 );
						setSendFallbackMessage(false);
					} else if ( sendButtonPressMessage ) {
						timeoutHandler = setTimeout( () => {
							sendActionButtonPressedAction(
								actionButtons.missingBlockAlertActionButton
							);
						}, 100 );
						setSendButtonPressMessage(false);
					}
				} }
			>
				<View style={ styles.infoContainer }>
					<Icon
						icon={ help }
						color={ infoSheetIconStyle.color }
						size={ styles.infoSheetIcon.size }
					/>
					<Text style={ [ infoTextStyle, infoTitleStyle ] }>
						{ infoTitle }
					</Text>
					{ isEditableInUnsupportedBlockEditor && (
						<Text style={ [ infoTextStyle, infoDescriptionStyle ] }>
							{ missingBlockDetail }
						</Text>
					) }
				</View>
				{ ( isUnsupportedBlockEditorSupported ||
					canEnableUnsupportedBlockEditor ) &&
					isEditableInUnsupportedBlockEditor && (
						<>
							<TextControl
								label={ missingBlockActionButton }
								separatorType="topFullWidth"
								onPress={ requestFallbackHandler }
								labelStyle={ actionButtonStyle }
							/>
							<TextControl
								label={ __( 'Dismiss' ) }
								separatorType="topFullWidth"
								onPress={ toggleSheetHandler }
								labelStyle={ actionButtonStyle }
							/>
						</>
					) }
			</BottomSheet>
		);
	}, [showHelp]);

    const { originalName } = props.attributes;
		const { getStylesFromColorScheme, preferredColorScheme } = props;
		const blockType = coreBlocks[ originalName ];

		const title = getTitleHandler();
		const titleStyle = getStylesFromColorScheme(
			styles.unsupportedBlockMessage,
			styles.unsupportedBlockMessageDark
		);

		const subTitleStyle = getStylesFromColorScheme(
			styles.unsupportedBlockSubtitle,
			styles.unsupportedBlockSubtitleDark
		);
		const subtitle = (
			<Text style={ subTitleStyle }>{ __( 'Unsupported' ) }</Text>
		);

		const icon = blockType
			? normalizeIconObject( blockType.settings.icon )
			: plugins;
		const iconStyle = getStylesFromColorScheme(
			styles.unsupportedBlockIcon,
			styles.unsupportedBlockIconDark
		);
		const iconClassName = 'unsupported-icon' + '-' + preferredColorScheme;
		return (
			<TouchableWithoutFeedback
				disabled={ ! props.isSelected }
				accessibilityLabel={ __( 'Help button' ) }
				accessibilityRole={ 'button' }
				accessibilityHint={ __( 'Tap here to show help' ) }
				onPress={ toggleSheetHandler }
			>
				<View
					style={ getStylesFromColorScheme(
						styles.unsupportedBlock,
						styles.unsupportedBlockDark
					) }
				>
					{ renderHelpIconHandler() }
					<Icon
						className={ iconClassName }
						icon={ icon && icon.src ? icon.src : icon }
						color={ iconStyle.color }
					/>
					<Text style={ titleStyle }>{ title }</Text>
					{ subtitle }
					{ renderSheetHandler( title, originalName ) }
				</View>
			</TouchableWithoutFeedback>
		); 
};




export default compose( [
	withSelect( ( select, { attributes } ) => {
		const { getSettings } = select( blockEditorStore );
		return {
			isUnsupportedBlockEditorSupported:
				getSettings( 'capabilities' ).unsupportedBlockEditor === true,
			canEnableUnsupportedBlockEditor:
				getSettings( 'capabilities' )
					.canEnableUnsupportedBlockEditor === true,
			isEditableInUnsupportedBlockEditor:
				! UBE_INCOMPATIBLE_BLOCKS.includes( attributes.originalName ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { selectBlock } = dispatch( blockEditorStore );
		return {
			selectBlock() {
				selectBlock( ownProps.clientId );
			},
		};
	} ),
	withPreferredColorScheme,
] )( UnsupportedBlockEdit );
