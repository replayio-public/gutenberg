/**
 * WordPress dependencies
 */

import { useState, useCallback } from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { View, TouchableOpacity, Linking, Alert } from 'react-native';
import { default as VideoPlayer } from 'react-native-video';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import PlayIcon from './gridicon-play';

// Default Video ratio 16:9
export const VIDEO_ASPECT_RATIO = 16 / 9;

const Video = (props) => {


    const [isFullScreen, setIsFullScreen] = useState(false);
    const [videoContainerHeight, setVideoContainerHeight] = useState(0);

    const onVideoLayoutHandler = useCallback(( event ) => {
		const { height } = event.nativeEvent.layout;
		if ( height !== videoContainerHeight ) {
			setVideoContainerHeight(height);
		}
	}, [videoContainerHeight]);
    const onPressPlayHandler = useCallback(() => {
		if ( isIOSHandler ) {
			if ( playerHandler ) {
				playerHandler.presentFullscreenPlayer();
			}
		} else {
			const { source } = props;
			if ( source && source.uri ) {
				openURLHandler( source.uri );
			}
		}
	}, []);
    // Tries opening the URL outside of the app
    const openURLHandler = useCallback(( url ) => {
		Linking.canOpenURL( url )
			.then( ( supported ) => {
				if ( ! supported ) {
					Alert.alert(
						__( 'Problem opening the video' ),
						__(
							'No application can handle this request. Please install a Web browser.'
						)
					);
					window.console.warn(
						'No application found that can open the video with URL: ' +
							url
					);
				} else {
					return Linking.openURL( url );
				}
			} )
			.catch( ( err ) => {
				Alert.alert(
					__( 'Problem opening the video' ),
					__( 'An unknown error occurred. Please try again.' )
				);
				window.console.error(
					'An error occurred while opening the video URL: ' + url,
					err
				);
			} );
	}, []);

    const { isSelected, style } = props;
		
		const showPlayButton = videoContainerHeight > 0;

		return (
			<View style={ styles.videoContainer }>
				<VideoPlayer
					{ ...props }
					ref={ ( ref ) => {
						playerHandler = ref;
					} }
					// Using built-in player controls is messing up the layout on iOS.
					// So we are setting controls=false and adding a play button that
					// will trigger presentFullscreenPlayer()
					controls={ false }
					ignoreSilentSwitch={ 'ignore' }
					paused={ ! isFullScreen }
					onLayout={ onVideoLayoutHandler }
					onFullscreenPlayerWillPresent={ () => {
						setIsFullScreen(true);
					} }
					onFullscreenPlayerDidDismiss={ () => {
						setIsFullScreen(false);
					} }
				/>
				{ showPlayButton && (
					// If we add the play icon as a subview to VideoPlayer then react-native-video decides to show control buttons
					// even if we set controls={ false }, so we are adding our play button as a sibling overlay view.
					<TouchableOpacity
						disabled={ ! isSelected }
						onPress={ onPressPlayHandler }
						style={ [ style, styles.overlayContainer ] }
					>
						<View style={ styles.blackOverlay } />
						<Icon
							icon={ PlayIcon }
							style={ styles.playIcon }
							size={ styles.playIcon.size }
						/>
					</TouchableOpacity>
				) }
			</View>
		); 
};




export default Video;
