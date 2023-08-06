/**
 * External dependencies
 */

import { View, TouchableWithoutFeedback, Text } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * WordPress dependencies
 */
import {
    requestImageFailedRetryDialog,
    requestImageUploadCancelDialog,
    mediaUploadSync,
} from '@wordpress/react-native-bridge';
import {
    BlockIcon,
    MediaPlaceholder,
    MediaUploadProgress,
    RichText,
    PlainText,
    BlockControls,
    MediaUpload,
    InspectorControls,
    MEDIA_TYPE_ANY,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import {
    ToolbarButton,
    ToolbarGroup,
    PanelBody,
    ToggleControl,
    TextControl,
    SelectControl,
    Icon,
} from '@wordpress/components';
import {
    file as icon,
    replace,
    button,
    external,
    link,
    warning,
} from '@wordpress/icons';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { getProtocol } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const URL_COPIED_NOTIFICATION_DURATION_MS = 1500;
const MIN_WIDTH = 40;

export export const FileEdit = (props) => {


    const [isUploadInProgress, setIsUploadInProgress] = useState(false);
    const [isSidebarLinkSettings, setIsSidebarLinkSettings] = useState(false);
    const [placeholderTextWidth, setPlaceholderTextWidth] = useState(0);
    const [maxWidth, setMaxWidth] = useState(0);

    useEffect(() => {
		const { attributes, setAttributes } = props;
		const { downloadButtonText } = attributes;

		if ( downloadButtonText === undefined || downloadButtonText === '' ) {
			setAttributes( {
				downloadButtonText: _x( 'Download', 'button label' ),
			} );
		}

		if (
			attributes.id &&
			attributes.url &&
			getProtocol( attributes.url ) === 'file:'
		) {
			mediaUploadSync();
		}
	}, []);
    useEffect(() => {
    return () => {
		clearTimeout( timerRefHandler );
	};
}, []);
    useEffect(() => {
		if (
			prevProps.isSidebarOpened &&
			! props.isSidebarOpened &&
			isSidebarLinkSettings
		) {
			setIsSidebarLinkSettings(false);
		}
	}, [isSidebarLinkSettings]);
    const onSelectFileHandler = useCallback(( media ) => {
		props.setAttributes( {
			href: media.url,
			fileName: media.title,
			textLinkHref: media.url,
			id: media.id,
		} );
	}, []);
    const onChangeFileNameHandler = useCallback(( fileName ) => {
		props.setAttributes( { fileName } );
	}, []);
    const onChangeDownloadButtonTextHandler = useCallback(( downloadButtonText ) => {
		props.setAttributes( { downloadButtonText } );
	}, []);
    const onChangeDownloadButtonVisibilityHandler = useCallback(( showDownloadButton ) => {
		props.setAttributes( { showDownloadButton } );
	}, []);
    const onChangeLinkDestinationOptionHandler = useCallback(( newHref ) => {
		// Choose Media File or Attachment Page (when file is in Media Library)
		props.setAttributes( { textLinkHref: newHref } );
	}, []);
    const onCopyURLHandler = useCallback(() => {
		if ( isUrlCopied ) {
			return;
		}
		const { href } = props.attributes;
		Clipboard.setString( href );

		setIsUrlCopied(true);
		timerRefHandler = setTimeout( () => {
			setIsUrlCopied(false);
		}, URL_COPIED_NOTIFICATION_DURATION_MS );
	}, []);
    const onChangeOpenInNewWindowHandler = useCallback(( newValue ) => {
		props.setAttributes( {
			textLinkTarget: newValue ? '_blank' : false,
		} );
	}, []);
    const updateMediaProgressHandler = useCallback(( payload ) => {
		const { setAttributes } = props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! isUploadInProgress ) {
			setIsUploadInProgress(true);
		}
	}, [isUploadInProgress]);
    const finishMediaUploadWithSuccessHandler = useCallback(( payload ) => {
		const { setAttributes } = props;

		setAttributes( {
			href: payload.mediaUrl,
			id: payload.mediaServerId,
			textLinkHref: payload.mediaUrl,
		} );
		setIsUploadInProgress(false);
	}, []);
    const finishMediaUploadWithFailureHandler = useCallback(( payload ) => {
		props.setAttributes( { id: payload.mediaId } );
		setIsUploadInProgress(false);
	}, []);
    const mediaUploadStateResetHandler = useCallback(() => {
		const { setAttributes } = props;

		setAttributes( {
			id: null,
			href: null,
			textLinkHref: null,
			fileName: null,
		} );
		setIsUploadInProgress(false);
	}, []);
    const onShowLinkSettingsHandler = useCallback(() => {
		setIsSidebarLinkSettings(true);
	}, []);
    const getToolbarEditButtonHandler = useCallback(( open ) => {
		return (
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Edit file' ) }
						icon={ replace }
						onClick={ open }
					/>
					<ToolbarButton
						title={ __( 'Link To' ) }
						icon={ link }
						onClick={ onShowLinkSettingsHandler }
					/>
				</ToolbarGroup>
			</BlockControls>
		);
	}, []);
    const getInspectorControlsHandler = useCallback((
		{ showDownloadButton, textLinkTarget, href, textLinkHref },
		media,
		isUploadInProgress,
		isUploadFailed
	) => {
		let linkDestinationOptions = [ { value: href, label: __( 'URL' ) } ];
		const attachmentPage = media && media.link;
		

		if ( attachmentPage ) {
			linkDestinationOptions = [
				{ value: href, label: __( 'Media file' ) },
				{ value: attachmentPage, label: __( 'Attachment page' ) },
			];
		}

		const actionButtonStyle = props.getStylesFromColorScheme(
			styles.actionButton,
			styles.actionButtonDark
		);

		const isCopyUrlDisabled = isUploadFailed || isUploadInProgress;

		const dimmedActionButtonStyle = props.getStylesFromColorScheme(
			styles.dimmedActionButton,
			styles.dimmedActionButtonDark
		);

		const finalButtonStyle = isCopyUrlDisabled
			? dimmedActionButtonStyle
			: actionButtonStyle;

		return (
			<InspectorControls>
				{ isSidebarLinkSettings || (
					<PanelBody title={ __( 'File block settings' ) } />
				) }
				<PanelBody>
					<SelectControl
						icon={ link }
						label={ __( 'Link to' ) }
						value={ textLinkHref }
						onChange={ onChangeLinkDestinationOptionHandler }
						options={ linkDestinationOptions }
						hideCancelButton={ true }
					/>
					<ToggleControl
						icon={ external }
						label={ __( 'Open in new tab' ) }
						checked={ textLinkTarget === '_blank' }
						onChange={ onChangeOpenInNewWindowHandler }
					/>
					{ ! isSidebarLinkSettings && (
						<ToggleControl
							icon={ button }
							label={ __( 'Show download button' ) }
							checked={ showDownloadButton }
							onChange={ onChangeDownloadButtonVisibilityHandler }
						/>
					) }
					<TextControl
						disabled={ isCopyUrlDisabled }
						label={
							isUrlCopied
								? __( 'Copied!' )
								: __( 'Copy file URL' )
						}
						labelStyle={
							isUrlCopied || finalButtonStyle
						}
						onPress={ onCopyURLHandler }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}, [isUploadInProgress, isSidebarLinkSettings]);
    const getStyleForAlignmentHandler = useCallback(( align ) => {
		const getFlexAlign = ( alignment ) => {
			switch ( alignment ) {
				case 'right':
					return 'flex-end';
				case 'center':
					return 'center';
				default:
					return 'flex-start';
			}
		};
		return { alignSelf: getFlexAlign( align ) };
	}, []);
    const getTextAlignmentForAlignmentHandler = useCallback(( align ) => {
		switch ( align ) {
			case 'right':
				return 'right';
			case 'center':
				return 'center';
			default:
				return 'left';
		}
	}, []);
    const onFilePressedHandler = useCallback(() => {
		const { attributes } = props;

		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if (
			attributes.id &&
			getProtocol( attributes.href ) === 'file:'
		) {
			requestImageFailedRetryDialog( attributes.id );
		}
	}, [isUploadInProgress]);
    const onLayoutHandler = useCallback(( { nativeEvent } ) => {
		const { width } = nativeEvent.layout;
		const { paddingLeft, paddingRight } = styles.defaultButton;
		setMaxWidth(width - ( paddingLeft + paddingRight ));
	}, []);
    // We use the same strategy implemented in Button block.
    const getPlaceholderWidthHandler = useCallback(( placeholderText ) => {
		
		return (
			<Text
				style={ styles.placeholder }
				onTextLayout={ ( { nativeEvent } ) => {
					const textWidth =
						nativeEvent.lines[ 0 ] && nativeEvent.lines[ 0 ].width;
					if ( textWidth && textWidth !== placeholderTextWidth ) {
						setPlaceholderTextWidth(Math.min(
								textWidth,
								maxWidth
							));
					}
				} }
			>
				{ placeholderText }
			</Text>
		);
	}, [placeholderTextWidth, maxWidth]);
    const getFileComponentHandler = useCallback(( openMediaOptions, getMediaOptions ) => {
		const { attributes, media, isSelected } = props;
		

		const { fileName, downloadButtonText, id, showDownloadButton, align } =
			attributes;

		const minWidth =
			isButtonFocused ||
			( ! isButtonFocused &&
				downloadButtonText &&
				downloadButtonText !== '' )
				? MIN_WIDTH
				: placeholderTextWidth;

		const placeholderText =
			isButtonFocused ||
			( ! isButtonFocused &&
				downloadButtonText &&
				downloadButtonText !== '' )
				? ''
				: __( 'Add text…' );

		return (
			<MediaUploadProgress
				mediaId={ id }
				onUpdateMediaProgress={ updateMediaProgressHandler }
				onFinishMediaUploadWithSuccess={
					finishMediaUploadWithSuccessHandler
				}
				onFinishMediaUploadWithFailure={
					finishMediaUploadWithFailureHandler
				}
				onMediaUploadStateReset={ mediaUploadStateResetHandler }
				renderContent={ ( { isUploadInProgress, isUploadFailed } ) => {
					const dimmedStyle =
						( isUploadInProgress || isUploadFailed ) &&
						styles.disabledButton;
					const finalButtonStyle = [
						styles.defaultButton,
						dimmedStyle,
					];

					const errorIconStyle = Object.assign(
						{},
						styles.errorIcon,
						styles.uploadFailed
					);

					return (
						<TouchableWithoutFeedback
							accessible={ ! isSelected }
							onPress={ onFilePressedHandler }
							disabled={ ! isSelected }
						>
							<View
								onLayout={ onLayoutHandler }
								testID="file-edit-container"
							>
								{ getPlaceholderWidthHandler( placeholderText ) }
								{ isUploadInProgress ||
									getToolbarEditButtonHandler(
										openMediaOptions
									) }
								{ getMediaOptions() }
								{ isSelected &&
									getInspectorControlsHandler(
										attributes,
										media,
										isUploadInProgress,
										isUploadFailed
									) }
								<View style={ styles.container }>
									<RichText
										withoutInteractiveFormatting
										__unstableMobileNoFocusOnMount
										onChange={ onChangeFileNameHandler }
										placeholder={ __( 'File name' ) }
										rootTagsToEliminate={ [ 'p' ] }
										tagName="p"
										underlineColorAndroid="transparent"
										value={ fileName }
										deleteEnter={ true }
										textAlign={ getTextAlignmentForAlignmentHandler(
											align
										) }
									/>
									{ isUploadFailed && (
										<View style={ styles.errorContainer }>
											<Icon
												icon={ warning }
												style={ errorIconStyle }
											/>
											<PlainText
												editable={ false }
												value={ __( 'Error' ) }
												style={ styles.uploadFailed }
											/>
										</View>
									) }
								</View>
								{ showDownloadButton &&
									maxWidth > 0 && (
										<View
											style={ [
												finalButtonStyle,
												getStyleForAlignmentHandler(
													align
												),
											] }
										>
											<RichText
												withoutInteractiveFormatting
												__unstableMobileNoFocusOnMount
												rootTagsToEliminate={ [ 'p' ] }
												tagName="p"
												textAlign="center"
												minWidth={ minWidth }
												maxWidth={ maxWidth }
												deleteEnter={ true }
												style={ styles.buttonText }
												value={ downloadButtonText }
												placeholder={ placeholderText }
												unstableOnFocus={ () =>
													setIsButtonFocused(true);
												}
												onBlur={ () =>
													setIsButtonFocused(false);
												}
												selectionColor={
													styles.buttonText.color
												}
												placeholderTextColor={
													styles.placeholderTextColor
														.color
												}
												underlineColorAndroid="transparent"
												onChange={
													onChangeDownloadButtonTextHandler
												}
											/>
										</View>
									) }
							</View>
						</TouchableWithoutFeedback>
					);
				} }
			/>
		);
	}, [placeholderTextWidth, isUploadInProgress, maxWidth]);

    const { attributes, wasBlockJustInserted, isSelected } = props;
		const { href } = attributes;

		if ( ! href ) {
			return (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'File' ),
						instructions: __( 'CHOOSE A FILE' ),
					} }
					onSelect={ onSelectFileHandler }
					onFocus={ props.onFocus }
					allowedTypes={ [ MEDIA_TYPE_ANY ] }
					autoOpenMediaUpload={ isSelected && wasBlockJustInserted }
				/>
			);
		}

		return (
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_ANY ] }
				isReplacingMedia={ true }
				onSelect={ onSelectFileHandler }
				render={ ( { open, getMediaOptions } ) => {
					return getFileComponentHandler( open, getMediaOptions );
				} }
			/>
		); 
};




export default compose( [
	withSelect( ( select, props ) => {
		const { attributes, isSelected, clientId } = props;
		const { id, href } = attributes;
		const { isEditorSidebarOpened } = select( 'core/edit-post' );
		const isNotFileHref = id && getProtocol( href ) !== 'file:';
		return {
			media: isNotFileHref
				? select( coreStore ).getMedia( id )
				: undefined,
			isSidebarOpened: isSelected && isEditorSidebarOpened(),
			wasBlockJustInserted: select(
				blockEditorStore
			).wasBlockJustInserted( clientId, 'inserter_menu' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { openGeneralSidebar } = dispatch( 'core/edit-post' );
		return {
			openSidebar: () => openGeneralSidebar( 'edit-post/block' ),
		};
	} ),
	withPreferredColorScheme,
] )( FileEdit );
