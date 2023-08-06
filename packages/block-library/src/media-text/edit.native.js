/**
 * External dependencies
 */

import { get } from 'lodash';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
    BlockControls,
    BlockVerticalAlignmentToolbar,
    InnerBlocks,
    InspectorControls,
    withColors,
    MEDIA_TYPE_IMAGE,
    MEDIA_TYPE_VIDEO,
    store as blockEditorStore,
} from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
import {
    Button,
    ToolbarGroup,
    PanelBody,
    ToggleControl,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { pullLeft, pullRight, replace } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const TEMPLATE = [ [ 'core/paragraph' ] ];
// this limits the resize to a safe zone to avoid making broken layouts
const WIDTH_CONSTRAINT_PERCENTAGE = 15;
const BREAKPOINTS = {
	mobile: 480,
};
const applyWidthConstraints = ( width ) =>
	Math.max(
		WIDTH_CONSTRAINT_PERCENTAGE,
		Math.min( width, 100 - WIDTH_CONSTRAINT_PERCENTAGE )
	);

const MediaTextEdit = (props) => {


    const [mediaWidth, setMediaWidth] = useState(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isMediaSelected, setIsMediaSelected] = useState(false);

    const onSelectMedia = useMemo(() => {
		const { setAttributes } = props;

		let mediaType;
		let src;
		// For media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === 'image' ) {
				mediaType = 'image';
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// video contain the media type of 'file' in the object returned from the rest api.
				mediaType = 'video';
			}
		} else {
			// For media selections originated from existing files in the media library.
			mediaType = media.type;
		}

		if ( mediaType === 'image' && media.sizes ) {
			// Try the "large" size URL, falling back to the "full" size URL below.
			src =
				get( media, [ 'sizes', 'large', 'url' ] ) ||
				get( media, [
					'media_details',
					'sizes',
					'large',
					'source_url',
				] );
		}

		setAttributes( {
			mediaAlt: media.alt,
			mediaId: media.id,
			mediaType,
			mediaUrl: src || media.url,
			imageFill: undefined,
			focalPoint: undefined,
		} );
	}, []);
    const onMediaUpdateHandler = useCallback(( media ) => {
		const { setAttributes } = props;

		setAttributes( {
			mediaId: media.id,
			mediaUrl: media.url,
		} );
	}, []);
    const onWidthChangeHandler = useCallback(( width ) => {
		setMediaWidth(applyWidthConstraints( width ));
	}, []);
    const commitWidthChangeHandler = useCallback(( width ) => {
		const { setAttributes } = props;

		setAttributes( {
			mediaWidth: applyWidthConstraints( width ),
		} );
		setMediaWidth(null);
	}, []);
    const onLayoutChangeHandler = useCallback(( { nativeEvent } ) => {
		const { width } = nativeEvent.layout;
		

		if ( containerWidth === width ) {
			return null;
		}

		setContainerWidth(width);
	}, [containerWidth]);
    const onMediaSelectedHandler = useCallback(() => {
		setIsMediaSelected(true);
	}, []);
    const onReplaceMediaHandler = useCallback(() => {
		if ( openPickerRefHandler ) {
			openPickerRefHandler();
		}
	}, []);
    const onSetOpenPickerRefHandler = useCallback(( openPicker ) => {
		openPickerRefHandler = openPicker;
	}, []);
    const onSetImageFillHandler = useCallback(() => {
		const { attributes, setAttributes } = props;
		const { imageFill } = attributes;

		setAttributes( {
			imageFill: ! imageFill,
		} );
	}, []);
    const getControlsHandler = useCallback(() => {
		const { attributes } = props;
		const { imageFill } = attributes;

		return (
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<ToggleControl
						label={ __( 'Crop image to fill entire column' ) }
						checked={ imageFill }
						onChange={ onSetImageFillHandler }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}, []);
    const renderMediaAreaHandler = useCallback(( shouldStack ) => {
		
		const { attributes, isSelected } = props;
		const {
			mediaAlt,
			mediaId,
			mediaPosition,
			mediaType,
			mediaUrl,
			mediaWidth,
			imageFill,
			focalPoint,
			verticalAlignment,
		} = attributes;
		const mediaAreaWidth =
			mediaWidth && ! shouldStack
				? ( containerWidth * mediaWidth ) / 100 -
				  styles.mediaAreaPadding.width
				: containerWidth;
		const aligmentStyles =
			styles[
				`is-vertically-aligned-${ verticalAlignment || 'center' }`
			];

		return (
			<MediaContainer
				commitWidthChange={ commitWidthChangeHandler }
				isMediaSelected={ isMediaSelected }
				onFocus={ props.onFocus }
				onMediaSelected={ onMediaSelectedHandler }
				onMediaUpdate={ onMediaUpdateHandler }
				onSelectMedia={ onSelectMedia }
				onSetOpenPickerRef={ onSetOpenPickerRefHandler }
				onWidthChange={ onWidthChangeHandler }
				mediaWidth={ mediaAreaWidth }
				{ ...{
					mediaAlt,
					mediaId,
					mediaType,
					mediaUrl,
					mediaPosition,
					imageFill,
					focalPoint,
					isSelected,
					aligmentStyles,
					shouldStack,
				} }
			/>
		);
	}, [mediaWidth, containerWidth, isMediaSelected]);

    const {
			attributes,
			backgroundColor,
			setAttributes,
			isSelected,
			isRTL,
			style,
			blockWidth,
		} = props;
		const {
			isStackedOnMobile,
			imageFill,
			mediaPosition,
			mediaWidth,
			mediaType,
			verticalAlignment,
		} = attributes;
		

		const isMobile = containerWidth < BREAKPOINTS.mobile;
		const shouldStack = isStackedOnMobile && isMobile;
		const temporaryMediaWidth = shouldStack
			? 100
			: mediaWidth || mediaWidth;
		const widthString = `${ temporaryMediaWidth }%`;
		const innerBlockWidth = shouldStack ? 100 : 100 - temporaryMediaWidth;
		const innerBlockWidthString = `${ innerBlockWidth }%`;
		const hasMedia =
			mediaType === MEDIA_TYPE_IMAGE || mediaType === MEDIA_TYPE_VIDEO;

		const innerBlockContainerStyle = [
			{ width: innerBlockWidthString },
			! shouldStack
				? styles.innerBlock
				: {
						...( mediaPosition === 'left'
							? styles.innerBlockStackMediaLeft
							: styles.innerBlockStackMediaRight ),
				  },
			( style?.backgroundColor || backgroundColor.color ) &&
				styles.innerBlockPaddings,
		];

		const containerStyles = {
			...styles[ 'wp-block-media-text' ],
			...styles[
				`is-vertically-aligned-${ verticalAlignment || 'center' }`
			],
			...( mediaPosition === 'right'
				? styles[ 'has-media-on-the-right' ]
				: {} ),
			...( shouldStack && styles[ 'is-stacked-on-mobile' ] ),
			...( shouldStack && mediaPosition === 'right'
				? styles[ 'is-stacked-on-mobile.has-media-on-the-right' ]
				: {} ),
			...( isSelected && styles[ 'is-selected' ] ),
			backgroundColor: style?.backgroundColor || backgroundColor.color,
			paddingBottom: 0,
		};

		const mediaContainerStyle = [
			{ flex: 1 },
			shouldStack
				? {
						...( mediaPosition === 'left' &&
							styles.mediaStackLeft ),
						...( mediaPosition === 'right' &&
							styles.mediaStackRight ),
				  }
				: {
						...( mediaPosition === 'left' && styles.mediaLeft ),
						...( mediaPosition === 'right' && styles.mediaRight ),
				  },
		];

		const toolbarControls = [
			{
				icon: isRTL ? pullRight : pullLeft,
				title: __( 'Show media on left' ),
				isActive: mediaPosition === 'left',
				onClick: () => setAttributes( { mediaPosition: 'left' } ),
			},
			{
				icon: isRTL ? pullLeft : pullRight,
				title: __( 'Show media on right' ),
				isActive: mediaPosition === 'right',
				onClick: () => setAttributes( { mediaPosition: 'right' } ),
			},
		];

		const onVerticalAlignmentChange = ( alignment ) => {
			setAttributes( { verticalAlignment: alignment } );
		};

		return (
			<>
				{ mediaType === MEDIA_TYPE_IMAGE && getControlsHandler() }
				<BlockControls>
					{ hasMedia && (
						<ToolbarGroup>
							<Button
								label={ __( 'Edit media' ) }
								icon={ replace }
								onClick={ onReplaceMediaHandler }
							/>
						</ToolbarGroup>
					) }
					{ ( ! isMediaSelected ||
						mediaType === MEDIA_TYPE_VIDEO ) && (
						<>
							<ToolbarGroup controls={ toolbarControls } />
							<BlockVerticalAlignmentToolbar
								onChange={ onVerticalAlignmentChange }
								value={ verticalAlignment }
							/>
						</>
					) }
				</BlockControls>
				<View
					style={ containerStyles }
					onLayout={ onLayoutChangeHandler }
				>
					<View
						style={ [
							( shouldStack || ! imageFill ) && {
								width: widthString,
							},
							mediaContainerStyle,
						] }
					>
						{ renderMediaAreaHandler( shouldStack ) }
					</View>
					<View style={ innerBlockContainerStyle }>
						<InnerBlocks
							template={ TEMPLATE }
							blockWidth={ blockWidth }
						/>
					</View>
				</View>
			</>
		); 
};

MediaTextEdit.getDerivedStateFromProps = ( props, state ) => {
		return {
			isMediaSelected:
				state.isMediaSelected &&
				props.isSelected &&
				! props.isAncestorSelected,
		};
	};


export default compose(
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const { getSelectedBlockClientId, getBlockParents, getSettings } =
			select( blockEditorStore );

		const parents = getBlockParents( clientId, true );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isAncestorSelected =
			selectedBlockClientId && parents.includes( selectedBlockClientId );

		return {
			isSelected: selectedBlockClientId === clientId,
			isAncestorSelected,
			isRTL: getSettings().isRTL,
		};
	} )
)( MediaTextEdit );
