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
import {
    subscribeMediaUpload,
    subscribeMediaSave,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const MEDIA_UPLOAD_STATE_UPLOADING = 1;
export const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
export const MEDIA_UPLOAD_STATE_FAILED = 3;
export const MEDIA_UPLOAD_STATE_RESET = 4;

export const MEDIA_SAVE_STATE_SAVING = 5;
export const MEDIA_SAVE_STATE_SUCCEEDED = 6;
export const MEDIA_SAVE_STATE_FAILED = 7;
export const MEDIA_SAVE_STATE_RESET = 8;
export const MEDIA_SAVE_FINAL_STATE_RESULT = 9;
export const MEDIA_SAVE_MEDIAID_CHANGED = 10;

export export const BlockMediaUpdateProgress = (props) => {


    const [progress, setProgress] = useState(0);
    const [isSaveInProgress, setIsSaveInProgress] = useState(false);
    const [isSaveFailed, setIsSaveFailed] = useState(false);
    const [isUploadInProgress, setIsUploadInProgress] = useState(false);
    const [isUploadFailed, setIsUploadFailed] = useState(false);

    useEffect(() => {
		addMediaUploadListenerHandler();
		addMediaSaveListenerHandler();
	}, []);
    useEffect(() => {
    return () => {
		removeMediaUploadListenerHandler();
		removeMediaSaveListenerHandler();
	};
}, []);
    const mediaIdContainedInMediaFilesHandler = useCallback(( mediaId, mediaFiles ) => {
		if ( mediaId !== undefined && mediaFiles !== undefined ) {
			return mediaFiles.some(
				( element ) => element.id === mediaId.toString()
			);
		}
		return false;
	}, []);
    const mediaUploadHandler = useCallback(( payload ) => {
		const { mediaFiles } = props;

		if (
			mediaIdContainedInMediaFilesHandler( payload.mediaId, mediaFiles ) ===
			false
		) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_UPLOAD_STATE_UPLOADING:
				updateMediaUploadProgressHandler( payload );
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
    const mediaSaveHandler = useCallback(( payload ) => {
		const { mediaFiles } = props;

		if (
			mediaIdContainedInMediaFilesHandler( payload.mediaId, mediaFiles ) ===
			false
		) {
			return;
		}

		switch ( payload.state ) {
			case MEDIA_SAVE_STATE_SAVING:
				updateMediaSaveProgressHandler( payload );
				break;
			case MEDIA_SAVE_STATE_SUCCEEDED:
				finishMediaSaveWithSuccessHandler( payload );
				break;
			case MEDIA_SAVE_STATE_FAILED:
				finishMediaSaveWithFailureHandler( payload );
				break;
			case MEDIA_SAVE_STATE_RESET:
				mediaSaveStateResetHandler( payload );
				break;
			case MEDIA_SAVE_FINAL_STATE_RESULT:
				finalSaveResultHandler( payload );
				break;
			case MEDIA_SAVE_MEDIAID_CHANGED:
				mediaIdChangedHandler( payload );
				break;
		}
	}, []);
    // ---- Block media save actions.
    const updateMediaSaveProgressHandler = useCallback(( payload ) => {
		setProgress(payload.progress);
    setIsUploadInProgress(false);
    setIsUploadFailed(false);
    setIsSaveInProgress(true);
    setIsSaveFailed(false);
		if ( props.onUpdateMediaSaveProgress ) {
			props.onUpdateMediaSaveProgress( payload );
		}
	}, []);
    const finishMediaSaveWithSuccessHandler = useCallback(( payload ) => {
		setIsSaveInProgress(false);
		if ( props.onFinishMediaSaveWithSuccess ) {
			props.onFinishMediaSaveWithSuccess( payload );
		}
	}, []);
    const finishMediaSaveWithFailureHandler = useCallback(( payload ) => {
		setIsSaveInProgress(false);
    setIsSaveFailed(true);
		if ( props.onFinishMediaSaveWithFailure ) {
			props.onFinishMediaSaveWithFailure( payload );
		}
	}, []);
    const mediaSaveStateResetHandler = useCallback(( payload ) => {
		setIsSaveInProgress(false);
    setIsSaveFailed(false);
		if ( props.onMediaSaveStateReset ) {
			props.onMediaSaveStateReset( payload );
		}
	}, []);
    const finalSaveResultHandler = useCallback(( payload ) => {
		setProgress(payload.progress);
    setIsUploadInProgress(false);
    setIsUploadFailed(false);
    setIsSaveInProgress(false);
    setIsSaveFailed(! payload.success);
		if ( props.onFinalSaveResult ) {
			props.onFinalSaveResult( payload );
		}
	}, []);
    const mediaIdChangedHandler = useCallback(( payload ) => {
		setIsUploadInProgress(false);
    setIsUploadFailed(false);
    setIsSaveInProgress(false);
    setIsSaveFailed(false);
		if ( props.onMediaIdChanged ) {
			props.onMediaIdChanged( payload );
		}
	}, []);
    // ---- Block media upload actions.
    const updateMediaUploadProgressHandler = useCallback(( payload ) => {
		setProgress(payload.progress);
    setIsUploadInProgress(true);
    setIsUploadFailed(false);
    setIsSaveInProgress(false);
    setIsSaveFailed(false);
		if ( props.onUpdateMediaUploadProgress ) {
			props.onUpdateMediaUploadProgress( payload );
		}
	}, []);
    const finishMediaUploadWithSuccessHandler = useCallback(( payload ) => {
		setIsUploadInProgress(false);
    setIsSaveInProgress(false);
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
    const addMediaSaveListenerHandler = useCallback(() => {
		// If we already have a subscription not worth doing it again.
		if ( subscriptionParentMediaSaveHandler ) {
			return;
		}
		subscriptionParentMediaSaveHandler = subscribeMediaSave( ( payload ) => {
			mediaSaveHandler( payload );
		} );
	}, []);
    const removeMediaSaveListenerHandler = useCallback(() => {
		if ( subscriptionParentMediaSaveHandler ) {
			subscriptionParentMediaSaveHandler.remove();
		}
	}, []);

    const { renderContent = () => null } = props;
		
		const showSpinner =
			isUploadInProgress || isSaveInProgress;
		const progress = progress * 100;
		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		const retryMessageSave = __(
			'Failed to save files.\nPlease tap for options.'
		);
		// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
		const retryMessageUpload = __(
			'Failed to upload files.\nPlease tap for options.'
		);
		let retryMessage = retryMessageSave;
		if ( isUploadFailed ) {
			retryMessage = retryMessageUpload;
		}

		return (
			<View style={ styles.mediaUploadProgress } pointerEvents="box-none">
				{ showSpinner && (
					<View style={ styles.progressBar }>
						<Spinner progress={ progress } testID="spinner" />
					</View>
				) }
				{ renderContent( {
					isUploadInProgress,
					isUploadFailed,
					isSaveInProgress,
					isSaveFailed,
					retryMessage,
				} ) }
			</View>
		); 
};




export default BlockMediaUpdateProgress;
