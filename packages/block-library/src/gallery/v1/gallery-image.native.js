/**
 * External dependencies
 */

import {
    StyleSheet,
    View,
    ScrollView,
    TouchableWithoutFeedback,
} from 'react-native';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
    requestImageFailedRetryDialog,
    requestImageUploadCancelDialog,
    requestImageFullscreenPreview,
} from '@wordpress/react-native-bridge';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { Image } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Caption, MediaUploadProgress } from '@wordpress/block-editor';
import { getProtocol } from '@wordpress/url';
import { withPreferredColorScheme } from '@wordpress/compose';
import { arrowLeft, arrowRight, warning } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from './gallery-button';
import style from './gallery-image-style.scss';

const { compose } = StyleSheet;

const separatorStyle = compose( style.separator, {
	borderRightWidth: StyleSheet.hairlineWidth,
} );
const buttonStyle = compose( style.button, { aspectRatio: 1 } );
const ICON_SIZE_ARROW = 15;

const GalleryImage = (props) => {


    const [captionSelected, setCaptionSelected] = useState(false);
    const [isUploadInProgress, setIsUploadInProgress] = useState(false);
    const [didUploadFail, setDidUploadFail] = useState(false);

    const onSelectCaptionHandler = useCallback(() => {
		if ( ! captionSelected ) {
			setCaptionSelected(true);
		}

		if ( ! props.isSelected ) {
			props.onSelect();
		}
	}, [captionSelected]);
    const onMediaPressedHandler = useCallback(() => {
		const { id, url, isSelected } = props;
		

		onSelectImageHandler();

		if ( isUploadInProgress ) {
			requestImageUploadCancelDialog( id );
		} else if (
			didUploadFail ||
			( id && getProtocol( url ) === 'file:' )
		) {
			requestImageFailedRetryDialog( id );
		} else if ( isSelected && ! captionSelected ) {
			requestImageFullscreenPreview( url );
		}
	}, [isUploadInProgress, didUploadFail, captionSelected]);
    const onSelectImageHandler = useCallback(() => {
		if ( ! props.isBlockSelected ) {
			props.onSelectBlock();
		}

		if ( ! props.isSelected ) {
			props.onSelect();
		}

		if ( captionSelected ) {
			setCaptionSelected(false);
		}
	}, [captionSelected]);
    const onSelectMediaHandler = useCallback(( media ) => {
		const { setAttributes } = props;
		setAttributes( media );
	}, []);
    const onCaptionChangeHandler = useCallback(( caption ) => {
		const { setAttributes } = props;
		setAttributes( { caption } );
	}, []);
    useEffect(() => {
		const { isSelected, image, url } = props;
		if ( image && ! url ) {
			props.setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}

		// Unselect the caption so when the user selects other image and comeback
		// the caption is not immediately selected.
		if (
			captionSelected &&
			! isSelected &&
			prevProps.isSelected
		) {
			setCaptionSelected(false);
		}
	}, [captionSelected]);
    const updateMediaProgressHandler = useCallback(() => {
		if ( ! isUploadInProgress ) {
			setIsUploadInProgress(true);
		}
	}, [isUploadInProgress]);
    const finishMediaUploadWithSuccessHandler = useCallback(( payload ) => {
		setIsUploadInProgress(false);
    setDidUploadFail(false);

		props.setAttributes( {
			id: payload.mediaServerId,
			url: payload.mediaUrl,
		} );
	}, []);
    const finishMediaUploadWithFailureHandler = useCallback(() => {
		setIsUploadInProgress(false);
    setDidUploadFail(true);
	}, []);
    const renderContentHandler = useCallback(( params ) => {
		const {
			url,
			isFirstItem,
			isLastItem,
			isSelected,
			caption,
			onRemove,
			onMoveForward,
			onMoveBackward,
			'aria-label': ariaLabel,
			isCropped,
			getStylesFromColorScheme,
			isRTL,
		} = props;

		
		const { isUploadFailed, retryMessage } = params;
		const resizeMode = isCropped ? 'cover' : 'contain';

		const captionPlaceholderStyle = getStylesFromColorScheme(
			style.captionPlaceholder,
			style.captionPlaceholderDark
		);

		const shouldShowCaptionEditable = ! isUploadFailed && isSelected;
		const shouldShowCaptionExpanded =
			! isUploadFailed && ! isSelected && !! caption;

		const captionContainerStyle = shouldShowCaptionExpanded
			? style.captionExpandedContainer
			: style.captionContainer;

		const captionStyle = shouldShowCaptionExpanded
			? style.captionExpanded
			: style.caption;

		const mediaPickerOptions = [
			{
				destructiveButton: true,
				id: 'removeImage',
				label: __( 'Remove' ),
				onPress: onRemove,
				separated: true,
				value: 'removeImage',
			},
		];

		return (
			<>
				<Image
					alt={ ariaLabel }
					height={ style.image.height }
					isSelected={ isSelected }
					isUploadFailed={ isUploadFailed }
					isUploadInProgress={ isUploadInProgress }
					mediaPickerOptions={ mediaPickerOptions }
					onSelectMediaUploadOption={ onSelectMediaHandler }
					resizeMode={ resizeMode }
					url={ url }
					retryMessage={ retryMessage }
					retryIcon={ warning }
				/>

				{ ! isUploadInProgress && isSelected && (
					<View style={ style.toolbarContainer }>
						<View style={ style.toolbar }>
							<View style={ style.moverButtonContainer }>
								<Button
									style={ buttonStyle }
									icon={ isRTL ? arrowRight : arrowLeft }
									iconSize={ ICON_SIZE_ARROW }
									onClick={
										isFirstItem ? undefined : onMoveBackward
									}
									accessibilityLabel={ __(
										'Move Image Backward'
									) }
									aria-disabled={ isFirstItem }
									disabled={ ! isSelected }
								/>
								<View style={ separatorStyle } />
								<Button
									style={ buttonStyle }
									icon={ isRTL ? arrowLeft : arrowRight }
									iconSize={ ICON_SIZE_ARROW }
									onClick={
										isLastItem ? undefined : onMoveForward
									}
									accessibilityLabel={ __(
										'Move Image Forward'
									) }
									aria-disabled={ isLastItem }
									disabled={ ! isSelected }
								/>
							</View>
						</View>
					</View>
				) }

				{ ! isUploadInProgress &&
					( shouldShowCaptionEditable ||
						shouldShowCaptionExpanded ) && (
						<View style={ captionContainerStyle }>
							<ScrollView
								nestedScrollEnabled
								keyboardShouldPersistTaps="handled"
								bounces={ false }
							>
								<Caption
									inlineToolbar
									isSelected={ isSelected && captionSelected }
									onChange={ onCaptionChangeHandler }
									onFocus={ onSelectCaptionHandler }
									placeholder={
										isSelected ? __( 'Add caption' ) : null
									}
									placeholderTextColor={
										captionPlaceholderStyle.color
									}
									style={ captionStyle }
									value={ caption }
								/>
							</ScrollView>
						</View>
					) }
			</>
		);
	}, [isUploadInProgress, captionSelected]);
    const accessibilityLabelImageContainerHandler = useCallback(() => {
		const { caption, 'aria-label': ariaLabel } = props;

		return isEmpty( caption )
			? ariaLabel
			: ariaLabel +
					'. ' +
					sprintf(
						/* translators: accessibility text. %s: image caption. */
						__( 'Image caption. %s' ),
						caption
					);
	}, []);

    const { id, onRemove, getStylesFromColorScheme, isSelected } =
			props;

		const containerStyle = getStylesFromColorScheme(
			style.galleryImageContainer,
			style.galleryImageContainerDark
		);

		return (
			<TouchableWithoutFeedback
				onPress={ onMediaPressedHandler }
				accessible={ ! isSelected } // We need only child views to be accessible after the selection.
				accessibilityLabel={ accessibilityLabelImageContainerHandler() } // if we don't set this explicitly it reads system provided accessibilityLabels of all child components and those include pretty technical words which don't make sense
				accessibilityRole={ 'imagebutton' } // this makes VoiceOver to read a description of image provided by system on iOS and lets user know this is a button which conveys the message of tappablity
			>
				<View style={ containerStyle }>
					<MediaUploadProgress
						mediaId={ id }
						onUpdateMediaProgress={ updateMediaProgressHandler }
						onFinishMediaUploadWithSuccess={
							finishMediaUploadWithSuccessHandler
						}
						onFinishMediaUploadWithFailure={
							finishMediaUploadWithFailureHandler
						}
						onMediaUploadStateReset={ onRemove }
						renderContent={ renderContentHandler }
					/>
				</View>
			</TouchableWithoutFeedback>
		); 
};




export default withPreferredColorScheme( GalleryImage );
