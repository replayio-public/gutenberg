/**
 * External dependencies
 */

import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { subscribeMediaUpload } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const MEDIA_UPLOAD_STATE_UPLOADING = 1;
export const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
export const MEDIA_UPLOAD_STATE_FAILED = 3;
export const MEDIA_UPLOAD_STATE_RESET = 4;

export export const MediaUploadProgress = (props) => {


    const [progress, setProgress] = useState(0);
    const [isUploadInProgress, setIsUploadInProgress] = useState(false);
    const [isUploadFailed, setIsUploadFailed] = useState(false);

    useEffect(() => {
		addMediaUploadListenerHandler();
	}, []);
    useEffect(() => {
    return () => {
		removeMediaUploadListenerHandler();
	};
}, []);
    const mediaUploadHandler = useCallback(( payload ) => {
		const { mediaId } = props;

		if ( payload.mediaId !== mediaId ) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				updateMediaProgressHandler( payload );
				break;
			case MEDIA_UPLOAD_STATE_SUCCEEDED:
				finishMediaUploadWithSuccessHandler( payload );
				break;
			case MEDIA_UPLOAD_STATE_FAILED:
				finishMediaUploadWithFailureHandler( payload );
				break;
			case MEDIA_UPLOAD_STATE_RESET:
				mediaUploadStateResetHandler( payload );
				break;
		}
	}, []);
    const updateMediaProgressHandler = useCallback(( payload ) => {
		setProgress(payload.progress);
    setIsUploadInProgress(true);
    setIsUploadFailed(false);
		if ( props.onUpdateMediaProgress ) {
			props.onUpdateMediaProgress( payload );
		}
	}, []);
    const finishMediaUploadWithSuccessHandler = useCallback(( payload ) => {
		setIsUploadInProgress(false);
		if ( props.onFinishMediaUploadWithSuccess ) {
			props.onFinishMediaUploadWithSuccess( payload );
		}
	}, []);
    const finishMediaUploadWithFailureHandler = useCallback(( payload ) => {
		setIsUploadInProgress(false);
    setIsUploadFailed(true);
		if ( props.onFinishMediaUploadWithFailure ) {
			props.onFinishMediaUploadWithFailure( payload );
		}
	}, []);
    const mediaUploadStateResetHandler = useCallback(( payload ) => {
		setIsUploadInProgress(false);
    setIsUploadFailed(false);
		if ( props.onMediaUploadStateReset ) {
			props.onMediaUploadStateReset( payload );
		}
	}, []);
    const addMediaUploadListenerHandler = useCallback(() => {
		// If we already have a subscription not worth doing it again.
		if ( subscriptionParentMediaUploadHandler ) {
			return;
		}
		subscriptionParentMediaUploadHandler = subscribeMediaUpload(
			( payload ) => {
				mediaUploadHandler( payload );
			}
		);
	}, []);
    const removeMediaUploadListenerHandler = useCallback(() => {
		if ( subscriptionParentMediaUploadHandler ) {
			subscriptionParentMediaUploadHandler.remove();
		}
	}, []);

    const { renderContent = () => null } = props;
		
		const showSpinner = isUploadInProgress;
		const progress = progress * 100;
		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		const retryMessage = __(
			'Failed to insert media.\nTap for more info.'
		);

		const progressBarStyle = [
			styles.progressBar,
			showSpinner || styles.progressBarHidden,
			props.progressBarStyle,
		];

		return (
			<View
				style={ [
					styles.mediaUploadProgress,
					props.containerStyle,
				] }
				pointerEvents="box-none"
			>
				<View style={ progressBarStyle }>
					{ showSpinner && (
						<Spinner
							progress={ progress }
							style={ props.spinnerStyle }
							testID="spinner"
						/>
					) }
				</View>
				{ renderContent( {
					isUploadInProgress,
					isUploadFailed,
					retryMessage,
				} ) }
			</View>
		); 
};




export default MediaUploadProgress;
