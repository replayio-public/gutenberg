/**
 * External dependencies
 */

import { View, TouchableWithoutFeedback, Text } from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import {
    mediaUploadSync,
    requestImageFailedRetryDialog,
    requestImageUploadCancelDialog,
} from '@wordpress/react-native-bridge';
import {
    Icon,
    ToolbarButton,
    ToolbarGroup,
    PanelBody,
} from '@wordpress/components';
import { withPreferredColorScheme, compose } from '@wordpress/compose';
import {
    BlockCaption,
    MediaPlaceholder,
    MediaUpload,
    MediaUploadProgress,
    MEDIA_TYPE_VIDEO,
    BlockControls,
    VIDEO_ASPECT_RATIO,
    VideoPlayer,
    InspectorControls,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { isURL, getProtocol } from '@wordpress/url';
import { doAction, hasAction } from '@wordpress/hooks';
import { video as SvgIcon, replace } from '@wordpress/icons';
import { withDispatch, withSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { createUpgradedEmbedBlock } from '../embed/util';
import style from './style.scss';
import SvgIconRetry from './icon-retry';

const ICON_TYPE = {
	PLACEHOLDER: 'placeholder',
	RETRY: 'retry',
	UPLOAD: 'upload',
};

const VideoEdit = (props) => {


    const [isCaptionSelected, setIsCaptionSelected] = useState(false);
    const [videoContainerHeight, setVideoContainerHeight] = useState(0);

    useEffect(() => {
		const { attributes } = props;
		if ( attributes.id && getProtocol( attributes.src ) === 'file:' ) {
			mediaUploadSync();
		}
	}, []);
    useEffect(() => {
    return () => {
		// This action will only exist if the user pressed the trash button on the block holder.
		if (
			hasAction( 'blocks.onRemoveBlockCheckUpload' ) &&
			isUploadInProgress
		) {
			doAction(
				'blocks.onRemoveBlockCheckUpload',
				props.attributes.id
			);
		}
	};
}, []);
    const onVideoPressedHandler = useCallback(() => {
		const { attributes } = props;

		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( attributes.id );
		} else if (
			attributes.id &&
			getProtocol( attributes.src ) === 'file:'
		) {
			requestImageFailedRetryDialog( attributes.id );
		}

		setIsCaptionSelected(false);
	}, []);
    const onFocusCaptionHandler = useCallback(() => {
		if ( ! isCaptionSelected ) {
			setIsCaptionSelected(true);
		}
	}, [isCaptionSelected]);
    const updateMediaProgressHandler = useCallback(( payload ) => {
		const { setAttributes } = props;
		if ( payload.mediaUrl ) {
			setAttributes( { url: payload.mediaUrl } );
		}
		if ( ! isUploadInProgress ) {
			setIsUploadInProgress(true);
		}
	}, []);
    const finishMediaUploadWithSuccessHandler = useCallback(( payload ) => {
		const { setAttributes } = props;
		setAttributes( { src: payload.mediaUrl, id: payload.mediaServerId } );
		setIsUploadInProgress(false);
	}, []);
    const finishMediaUploadWithFailureHandler = useCallback(( payload ) => {
		const { setAttributes } = props;
		setAttributes( { id: payload.mediaId } );
		setIsUploadInProgress(false);
	}, []);
    const mediaUploadStateResetHandler = useCallback(() => {
		const { setAttributes } = props;
		setAttributes( { id: null, src: null } );
		setIsUploadInProgress(false);
	}, []);
    const onSelectMediaUploadOptionHandler = useCallback(( { id, url } ) => {
		const { setAttributes } = props;
		setAttributes( { id, src: url } );
	}, []);
    const onSelectURLHandler = useCallback(( url ) => {
		const { createErrorNotice, onReplace, setAttributes } = props;

		if ( isURL( url ) ) {
			// Check if there's an embed block that handles this URL.
			const embedBlock = createUpgradedEmbedBlock( {
				attributes: { url },
			} );
			if ( undefined !== embedBlock ) {
				onReplace( embedBlock );
				return;
			}

			setAttributes( { id: url, src: url } );
		} else {
			createErrorNotice( __( 'Invalid URL.' ) );
		}
	}, []);
    const onVideoContanerLayoutHandler = useCallback(( event ) => {
		const { width } = event.nativeEvent.layout;
		const height = width / VIDEO_ASPECT_RATIO;
		if ( height !== videoContainerHeight ) {
			setVideoContainerHeight(height);
		}
	}, [videoContainerHeight]);
    const getIconHandler = useCallback(( iconType ) => {
		let iconStyle;
		switch ( iconType ) {
			case ICON_TYPE.RETRY:
				return <Icon icon={ SvgIconRetry } { ...style.icon } />;
			case ICON_TYPE.PLACEHOLDER:
				iconStyle = props.getStylesFromColorScheme(
					style.icon,
					style.iconDark
				);
				break;
			case ICON_TYPE.UPLOAD:
				iconStyle = props.getStylesFromColorScheme(
					style.iconUploading,
					style.iconUploadingDark
				);
				break;
		}

		return <Icon icon={ SvgIcon } { ...iconStyle } />;
	}, []);

    const { setAttributes, attributes, isSelected, wasBlockJustInserted } =
			props;
		const { id, src } = attributes;
		

		const toolbarEditButton = (
			<MediaUpload
				allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
				isReplacingMedia={ true }
				onSelect={ onSelectMediaUploadOptionHandler }
				onSelectURL={ onSelectURLHandler }
				render={ ( { open, getMediaOptions } ) => {
					return (
						<ToolbarGroup>
							{ getMediaOptions() }
							<ToolbarButton
								label={ __( 'Edit video' ) }
								icon={ replace }
								onClick={ open }
							/>
						</ToolbarGroup>
					);
				} }
			></MediaUpload>
		);

		if ( ! id ) {
			return (
				<View style={ { flex: 1 } }>
					<MediaPlaceholder
						allowedTypes={ [ MEDIA_TYPE_VIDEO ] }
						onSelect={ onSelectMediaUploadOptionHandler }
						onSelectURL={ onSelectURLHandler }
						icon={ getIconHandler( ICON_TYPE.PLACEHOLDER ) }
						onFocus={ props.onFocus }
						autoOpenMediaUpload={
							isSelected && wasBlockJustInserted
						}
					/>
				</View>
			);
		}

		return (
			<TouchableWithoutFeedback
				accessible={ ! isSelected }
				onPress={ onVideoPressedHandler }
				disabled={ ! isSelected }
			>
				<View style={ { flex: 1 } }>
					{ ! isCaptionSelected && (
						<BlockControls>{ toolbarEditButton }</BlockControls>
					) }
					{ isSelected && (
						<InspectorControls>
							<PanelBody title={ __( 'Settings' ) }>
								<VideoCommonSettings
									setAttributes={ setAttributes }
									attributes={ attributes }
								/>
							</PanelBody>
						</InspectorControls>
					) }
					<MediaUploadProgress
						mediaId={ id }
						onFinishMediaUploadWithSuccess={
							finishMediaUploadWithSuccessHandler
						}
						onFinishMediaUploadWithFailure={
							finishMediaUploadWithFailureHandler
						}
						onUpdateMediaProgress={ updateMediaProgressHandler }
						onMediaUploadStateReset={ mediaUploadStateResetHandler }
						renderContent={ ( {
							isUploadInProgress,
							isUploadFailed,
							retryMessage,
						} ) => {
							const showVideo =
								isURL( src ) &&
								! isUploadInProgress &&
								! isUploadFailed;
							const icon = getIconHandler(
								isUploadFailed
									? ICON_TYPE.RETRY
									: ICON_TYPE.UPLOAD
							);
							const styleIconContainer = isUploadFailed
								? style.modalIconRetry
								: style.modalIcon;

							const iconContainer = (
								<View style={ styleIconContainer }>
									{ icon }
								</View>
							);

							const videoStyle = {
								height: videoContainerHeight,
								...style.video,
							};

							const containerStyle =
								showVideo && isSelected
									? style.containerFocused
									: style.container;

							return (
								<View
									onLayout={ onVideoContanerLayoutHandler }
									style={ containerStyle }
								>
									{ showVideo && (
										<View style={ style.videoContainer }>
											<VideoPlayer
												isSelected={
													isSelected &&
													! isCaptionSelected
												}
												style={ videoStyle }
												source={ { uri: src } }
												paused={ true }
											/>
										</View>
									) }
									{ ! showVideo && (
										<View
											style={ {
												height: videoContainerHeight,
												width: '100%',
												...props.getStylesFromColorScheme(
													style.placeholderContainer,
													style.placeholderContainerDark
												),
											} }
										>
											{ videoContainerHeight > 0 &&
												iconContainer }
											{ isUploadFailed && (
												<Text
													style={
														style.uploadFailedText
													}
												>
													{ retryMessage }
												</Text>
											) }
										</View>
									) }
								</View>
							);
						} }
					/>
					<BlockCaption
						accessible={ true }
						accessibilityLabelCreator={ ( caption ) =>
							isEmpty( caption )
								? /* translators: accessibility text. Empty video caption. */
								  __( 'Video caption. Empty' )
								: sprintf(
										/* translators: accessibility text. %s: video caption. */
										__( 'Video caption. %s' ),
										caption
								  )
						}
						clientId={ props.clientId }
						isSelected={ isCaptionSelected }
						onFocus={ onFocusCaptionHandler }
						onBlur={ props.onBlur } // Always assign onBlur as props.
						insertBlocksAfter={ props.insertBlocksAfter }
					/>
				</View>
			</TouchableWithoutFeedback>
		); 
};

VideoEdit.getDerivedStateFromProps = ( props, state ) => {
		// Avoid a UI flicker in the toolbar by insuring that isCaptionSelected
		// is updated immediately any time the isSelected prop becomes false.
		return {
			isCaptionSelected: props.isSelected && state.isCaptionSelected,
		};
	};


export default compose( [
	withSelect( ( select, { clientId } ) => ( {
		wasBlockJustInserted: select( blockEditorStore ).wasBlockJustInserted(
			clientId,
			'inserter_menu'
		),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { createErrorNotice } = dispatch( noticesStore );

		return { createErrorNotice };
	} ),
	withPreferredColorScheme,
] )( VideoEdit );
